const amqp = require('amqplib');
const db = require('../database/db');

/**
 * Class for handling RabbitMQ connection and consuming user profile messages
 */
class MessagingSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.usersExchange = 'users_exchange';
    this.exchangeType = 'fanout';
    this.queueName = 'post_grades_users_queue';
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  /**
   * Initialize the connection to RabbitMQ
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   * @returns {Promise<void>} - Resolves when connected
   */
  async init(amqpUrl = 'amqp://rabbitmq:5672') {
    try {
      // Try to connect to RabbitMQ
      this.connection = await amqp.connect(amqpUrl);
      console.log('Subscriber connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ subscriber connection error:', err);
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ subscriber connection closed');
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      
      // Assert the exchange - ensures the exchange exists
      await this.channel.assertExchange(this.usersExchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      // Create a queue for this service
      const q = await this.channel.assertQueue(this.queueName, {
        durable: true, // Queue will survive broker restart
        exclusive: false
      });

      // Bind the queue to the exchange
      await this.channel.bindQueue(q.queue, this.usersExchange, '');
      console.log(`Queue '${q.queue}' bound to exchange '${this.usersExchange}'`);

      // Set up consumer
      await this.setupConsumer(q.queue);

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Subscriber is ready to consume user profile messages from queue '${q.queue}'`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ subscriber connection:', error);
      this.connected = false;
      this.retryConnection(amqpUrl);
    }
  }

  /**
   * Retry connection to RabbitMQ with backoff
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   */
  retryConnection(amqpUrl) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryInterval * this.retryCount;
      console.log(`Subscriber retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(amqpUrl), delay);
    } else {
      console.error(`Subscriber failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

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
      console.log('RabbitMQ subscriber connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ subscriber connection:', error);
    }
  }
}

// Create and export a singleton instance
const subscriber = new MessagingSubscriber();

module.exports = subscriber;