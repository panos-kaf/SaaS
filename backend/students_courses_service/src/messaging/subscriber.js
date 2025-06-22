const amqp = require('amqplib');
const config = require('../config/config');
const db = require('../db/db');
const { saveGradeFromQueue, saveUserFromQueue } = require('../models/queries');

class MessagingSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    // Grades exchange configuration
    this.gradesExchange = config.rabbitmq.gradesExchange;
    this.gradesQueue = config.rabbitmq.gradesQueue;
    // Users exchange configuration
    this.usersExchange = config.rabbitmq.usersExchange;
    this.usersQueue = config.rabbitmq.usersQueue;
    // Courses exchange configuration
    this.coursesExchange = config.rabbitmq.coursesExchange;
    this.coursesQueue = config.rabbitmq.coursesQueue;
    // Common configurations
    this.exchangeType = config.rabbitmq.exchangeType;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  /**
   * Initialize the connection to RabbitMQ
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Try to connect to RabbitMQ
      this.connection = await amqp.connect(config.rabbitmq.url);
      console.log('Connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.connected = false;
        this.retryConnection();
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connected = false;
        this.retryConnection();
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      
      // Set up grades exchange and queue
      await this.setupExchangeAndQueue(
        this.gradesExchange, 
        this.exchangeType, 
        this.gradesQueue, 
        this.setupGradesConsumer.bind(this)
      );
      
      // Set up users exchange and queue
      await this.setupExchangeAndQueue(
        this.usersExchange, 
        this.exchangeType, 
        this.usersQueue, 
        this.setupConsumer.bind(this)
      );

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log('Subscriber is ready to consume messages from all queues');
    } catch (error) {
      console.error('Failed to initialize RabbitMQ connection:', error);
      this.connected = false;
      this.retryConnection();
    }
  }
  
  /**
   * Set up an exchange and queue with the specified consumer function
   * @param {string} exchange - The exchange name
   * @param {string} exchangeType - The exchange type
   * @param {string} queueName - The queue name
   * @param {Function} consumerSetupFn - The function to set up the consumer
   */
  async setupExchangeAndQueue(exchange, exchangeType, queueName, consumerSetupFn) {
    console.log(`Setting up exchange: ${exchange}, queue: ${queueName}`);
    
    // Assert the exchange - ensures the exchange exists
    await this.channel.assertExchange(exchange, exchangeType, {
      durable: true // Exchange will survive broker restart
    });

    // Create a queue for this service
    const q = await this.channel.assertQueue(queueName, {
      durable: true, // Queue will survive broker restart
      exclusive: false
    });

    // Bind the queue to the exchange
    await this.channel.bindQueue(q.queue, exchange, '');
    console.log(`Queue '${q.queue}' bound to exchange '${exchange}'`);

    // Set up consumer
    await consumerSetupFn(q.queue);
    console.log(`Consumer setup completed for queue: ${q.queue}`);
  }

  /**
   * Retry connection to RabbitMQ with backoff
   */
  retryConnection() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryInterval * this.retryCount;
      console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(), delay);
    } else {
      console.error(`Failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

  /**
   * Set up the consumer for the grades queue
   * @param {string} queue - The queue to consume from
   */
  async setupGradesConsumer(queue) {
    try {
      console.log(`Setting up grades consumer for queue: ${queue}`);
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`[GRADES] Received grade message for student: ${content.student_academic_number}, course: ${content.course_code}`);
            console.log(`[GRADES] Full message content:`, content);
            
            // Process the grade message
            await this.processGradeMessage(content);
            
            // Acknowledge the message
            this.channel.ack(msg);
          } catch (err) {
            console.error('Error processing grade message:', err);
            // Reject the message and don't requeue
            this.channel.reject(msg, false);
          }
        }
      });
      console.log(`Grades consumer setup completed for queue: ${queue}`);
    } catch (error) {
      console.error('Error setting up grades consumer:', error);
    }
  }
  
  /**
   * Set up the consumer for the users queue
   * @param {string} queue - The queue to consume from
   */
  /**
   * Set up the consumer for the queue
   * @param {string} queue - The queue to consume from
   */
  async setupConsumer(queue) {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received user profile message for user: ${content.username}`);
            
            // Process the message
            await this.processUserProfileMessage(content);
            
            // Acknowledge the message
            this.channel.ack(msg);
          } catch (err) {
            console.error('Error processing user profile message:', err);
            // Reject the message and don't requeue
            this.channel.reject(msg, false);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up user profile consumer:', error);
    }
  }

    /**
     * Process a user profile message
     * @param {Object} userProfile - The user profile object
     * @returns {Promise<void>}
     */
    async processUserProfileMessage(userProfile) {
      try {
        console.log(`Processing user profile for user ID: ${userProfile.id}`);
        
        // Create full name from first and last name
        const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
        
        // Check if user profile already exists
        const userCheck = await db.query(
          'SELECT * FROM users_profile WHERE user_service_id = $1',
          [userProfile.id.toString()]
        );
        
        if (userCheck.rows.length === 0) {
          // Insert new user profile
          await db.query(
            `INSERT INTO users_profile (
              user_service_id, academic_id, first_name, last_name, 
              email, role, institution_id, department
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              userProfile.id.toString(),
              userProfile.academic_id || '',
              userProfile.first_name || '',
              userProfile.last_name || '', 
              userProfile.email,
              userProfile.role,
              userProfile.institution_id,
              userProfile.department || ''
            ]
          );
          console.log(`Inserted new user profile for user ID: ${userProfile.id}`);
        } else {
          // Update existing user profile
          await db.query(
            `UPDATE users_profile SET 
              academic_id = $2,
              first_name = $3,
              last_name = $4,
              email = $5,
              role = $6,
              institution_id = $7,
              department = $8,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_service_id = $1`,
            [
              userProfile.id.toString(),
              userProfile.academic_id || '',
              userProfile.first_name || '',
              userProfile.last_name || '', 
              userProfile.email,
              userProfile.role,
              userProfile.institution_id,
              userProfile.department || ''
            ]
          );
          console.log(`Updated user profile for user ID: ${userProfile.id}`);
        }
      } catch (error) {
        console.error('Error processing user profile message:', error);
        throw error;
      }
    }
  
  /**
   * Process a grade message
   * @param {Object} grade - The grade object
   */
  async processGradeMessage(grade) {
    try {
      console.log(`[GRADES] Processing grade message for student: ${grade.student_academic_number}, course: ${grade.course_code}`);
      
      // Save the grade to the database
      const result = await saveGradeFromQueue(grade);
      
      if (result.inserted) {
        console.log(`[GRADES] ✅ Inserted new grade for student ${grade.student_academic_number}, course ${grade.course_code}`);
      } else if (result.updated) {
        console.log(`[GRADES] ✅ Updated existing grade for student ${grade.student_academic_number}, course ${grade.course_code}`);
      }
    } catch (error) {
      console.error('[GRADES] ❌ Error processing grade message:', error);
      throw error;
    }
  }
  
  /**
   * Process a user message
   * @param {Object} user - The user object
   */
  async processUserMessage(user) {
    try {
      // Save the user to the database
      const result = await saveUserFromQueue(user);
      
      if (result.inserted) {
        console.log(`Inserted new user: ${user.academic_number || user.email}`);
      } else if (result.updated) {
        console.log(`Updated existing user: ${user.academic_number || user.email}`);
      }
    } catch (error) {
      console.error('Error processing user message:', error);
      throw error;
    }
  }

  /**
   * Close the connection to RabbitMQ
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.connected = false;
      console.log('RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

// Create and export a singleton instance
const subscriber = new MessagingSubscriber();

module.exports = subscriber;
