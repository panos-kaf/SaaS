const amqp = require('amqplib');
const db = require('../database/db');
const config = require('../config/config');

/**
 * Class for handling RabbitMQ connections and message consumption
 */
class MessagingSubscriber {
  constructor() {
    // User events configuration
    this.userConnection = null;
    this.userChannel = null;
    this.usersExchange = config.USERS_EXCHANGE;
    this.userExchangeType = 'fanout';
    this.userQueueName = 'replies_service_users';
    
    // Request events configuration
    this.requestConnection = null;
    this.requestChannel = null;
    this.requestExchange = config.REQUESTS_EXCHANGE;
    this.requestExchangeType = 'direct';
    this.requestQueueName = 'replies_service_requests';
    this.requestRoutingKey = config.REQUESTS_ROUTING_KEY;
    
    // Connection state
    this.userConnected = false;
    this.requestConnected = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  /**
   * Initialize all subscribers
   * @returns {Promise<void>}
   */
  async initSubscribers() {
    try {
      await this.initUserSubscriber();
      await this.initRequestSubscriber();
      console.log('All messaging subscribers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize subscribers:', error);
      throw error;
    }
  }

  /**
   * Initialize the connection to RabbitMQ for user events
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   * @returns {Promise<void>}
   */
  async initUserSubscriber(amqpUrl = 'amqp://rabbitmq:5672') {
    try {
      // Try to connect to RabbitMQ
      this.userConnection = await amqp.connect(amqpUrl);
      console.log('User subscriber connected to RabbitMQ');

      // Handle connection errors
      this.userConnection.on('error', (err) => {
        console.error('RabbitMQ user subscriber connection error:', err);
        this.userConnected = false;
        this.retryUserConnection(amqpUrl);
      });

      // Handle connection close
      this.userConnection.on('close', () => {
        console.log('RabbitMQ user subscriber connection closed');
        this.userConnected = false;
        this.retryUserConnection(amqpUrl);
      });

      // Create a channel
      this.userChannel = await this.userConnection.createChannel();
      
      // Assert the exchange
      await this.userChannel.assertExchange(this.usersExchange, this.userExchangeType, {
        durable: true
      });

      // Create a queue for this service
      const q = await this.userChannel.assertQueue(this.userQueueName, {
        durable: true,
        exclusive: false
      });

      // Bind the queue to the exchange
      await this.userChannel.bindQueue(q.queue, this.usersExchange, '');
      console.log(`Queue '${q.queue}' bound to exchange '${this.usersExchange}'`);

      // Set up consumer
      await this.setupConsumer(q.queue);

      this.userConnected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`User subscriber is ready to consume messages from queue '${q.queue}'`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ user subscriber connection:', error);
      this.userConnected = false;
      this.retryUserConnection(amqpUrl);
    }
  }

  /**
   * Initialize the connection to RabbitMQ for request events
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   * @returns {Promise<void>}
   */
  async initRequestSubscriber(amqpUrl = 'amqp://rabbitmq:5672') {
    try {
      // Try to connect to RabbitMQ
      this.requestConnection = await amqp.connect(amqpUrl);
      console.log('Request subscriber connected to RabbitMQ');

      // Handle connection errors
      this.requestConnection.on('error', (err) => {
        console.error('RabbitMQ request subscriber connection error:', err);
        this.requestConnected = false;
        this.retryRequestConnection(amqpUrl);
      });

      // Handle connection close
      this.requestConnection.on('close', () => {
        console.log('RabbitMQ request subscriber connection closed');
        this.requestConnected = false;
        this.retryRequestConnection(amqpUrl);
      });

      // Create a channel
      this.requestChannel = await this.requestConnection.createChannel();
      
      // Assert the exchange
      await this.requestChannel.assertExchange(this.requestExchange, this.requestExchangeType, {
        durable: true
      });

      // Create a queue for this service
      const q = await this.requestChannel.assertQueue(this.requestQueueName, {
        durable: true,
        exclusive: false
      });

      // Bind the queue to the exchange with routing key
      await this.requestChannel.bindQueue(q.queue, this.requestExchange, this.requestRoutingKey);
      console.log(`Queue '${q.queue}' bound to exchange '${this.requestExchange}' with routing key '${this.requestRoutingKey}'`);

      // Set up consumer
      await this.setupRequestConsumer(q.queue);

      this.requestConnected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Request subscriber is ready to consume messages from queue '${q.queue}'`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ request subscriber connection:', error);
      this.requestConnected = false;
      this.retryRequestConnection(amqpUrl);
    }
  }

  /**
   * Retry connection to RabbitMQ for user events with backoff
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   */
  retryUserConnection(amqpUrl) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryInterval * this.retryCount;
      console.log(`User subscriber retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.initUserSubscriber(amqpUrl), delay);
    } else {
      console.error(`User subscriber failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

  /**
   * Retry connection to RabbitMQ for request events with backoff
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   */
  retryRequestConnection(amqpUrl) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryInterval * this.retryCount;
      console.log(`Request subscriber retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.initRequestSubscriber(amqpUrl), delay);
    } else {
      console.error(`Request subscriber failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }


  /**
   * Set up the user consumer for the queue
   * @param {string} queue - The queue to consume from
   */
  async setupConsumer(queue) {
    try {
      await this.userChannel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received user profile message for user: ${content.username}`);
            
            // Process the message
            await this.processUserProfileMessage(content);
            
            // Acknowledge the message
            this.userChannel.ack(msg);
          } catch (err) {
            console.error('Error processing user profile message:', err);
            // Reject the message and don't requeue
            this.userChannel.reject(msg, false);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up user profile consumer:', error);
    }
  }

  /**
   * Set up the consumer for request events
   * @param {string} queue - The queue to consume from
   */
  async setupRequestConsumer(queue) {
    try {
      await this.requestChannel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received request event: ${content.event_type}`);
            
            // Process the message
            await this.handleRequestEvent(content);
            
            // Acknowledge the message
            this.requestChannel.ack(msg);
          } catch (err) {
            console.error('Error processing request event:', err);
            // Reject the message and don't requeue
            this.requestChannel.reject(msg, false);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up request events consumer:', error);
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
   * Handle request events
   * @param {Object} eventData - The event data
   */
  async handleRequestEvent(eventData) {
    const { event_type, data } = eventData;
    
    try {
      if (event_type === 'request_created' || event_type === 'request_updated') {
        // Upsert request data
        const query = `
          INSERT INTO requests (
            request_id, owner_id, grade_id, prof_id, request_body, status, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (request_id) 
          DO UPDATE SET 
            owner_id = $2,
            grade_id = $3,
            prof_id = $4,
            request_body = $5,
            status = $6,
            timestamp = $7
          RETURNING *`;
        
        const values = [
          data.request_id,
          data.owner_id,
          data.grade_id,
          data.prof_id,
          data.request_body,
          data.status,
          data.timestamp || new Date()
        ];
        
        const result = await db.query(query, values);
        console.log(`Request ${event_type} event processed for request: ${data.request_id}`);
      } else if (event_type === 'request_deleted') {
        // Delete request data (will cascade to replies due to foreign key constraint)
        await db.query(
          'DELETE FROM requests WHERE request_id = $1',
          [data.request_id]
        );
        console.log(`Request deleted event processed for request: ${data.request_id}`);
      }
    } catch (error) {
      console.error(`Error handling request event ${event_type}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections to RabbitMQ
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.userChannel) {
        await this.userChannel.close();
      }
      if (this.userConnection) {
        await this.userConnection.close();
      }
      if (this.requestChannel) {
        await this.requestChannel.close();
      }
      if (this.requestConnection) {
        await this.requestConnection.close();
      }
      this.userConnected = false;
      this.requestConnected = false;
      console.log('All RabbitMQ subscriber connections closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ subscriber connections:', error);
    }
  }
}

// Create and export a singleton instance
const subscriber = new MessagingSubscriber();

module.exports = subscriber;