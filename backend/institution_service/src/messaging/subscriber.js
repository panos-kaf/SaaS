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
    this.userQueueName = 'institution_service_users';
    
    // Connection state
    this.userConnected = false;
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
  async initUserSubscriber(amqpUrl = config.RABBITMQ_URL) {
    try {
      // Connect to RabbitMQ for user events
      this.userConnection = await amqp.connect(amqpUrl);
      console.log('User subscriber connected to RabbitMQ');

      // Handle connection errors
      this.userConnection.on('error', (err) => {
        console.error('RabbitMQ user connection error:', err);
        this.userConnected = false;
        this.retryUserConnection();
      });

      this.userConnection.on('close', () => {
        console.log('RabbitMQ user connection closed');
        this.userConnected = false;
        this.retryUserConnection();
      });

      // Create channel for user events
      this.userChannel = await this.userConnection.createChannel();
      console.log('User subscriber channel created');

      // Declare exchange and queue for user events
      await this.userChannel.assertExchange(this.usersExchange, this.userExchangeType, { durable: true });
      await this.userChannel.assertQueue(this.userQueueName, { durable: true });
      await this.userChannel.bindQueue(this.userQueueName, this.usersExchange, '');

      // Set up consumer for user events
      await this.setupConsumer(this.userQueueName);

      this.userConnected = true;
      this.retryCount = 0;
      console.log('User subscriber setup complete');

    } catch (error) {
      console.error('Failed to initialize user subscriber:', error);
      this.userConnected = false;
      await this.retryUserConnection();
    }
  }

  /**
   * Retry connection to RabbitMQ for user events with backoff
   * @returns {Promise<void>}
   */
  async retryUserConnection() {
    if (this.retryCount >= this.maxRetries) {
      console.error(`Max retries (${this.maxRetries}) reached for user subscriber. Giving up.`);
      return;
    }

    this.retryCount++;
    const delay = this.retryInterval * this.retryCount;
    console.log(`Retrying user subscriber connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

    setTimeout(async () => {
      await this.initUserSubscriber();
    }, delay);
  }

//   /**
//    * Handle incoming user messages
//    * @param {Object} msg - The message from RabbitMQ
//    */
//   async handleUserMessage(msg) {
//     if (!msg) return;

//     try {
//       const content = JSON.parse(msg.content.toString());
//       console.log('Received user message:', content);

//       switch (content.event_type) {
//         case 'user_created':
//         case 'user_updated':
//           await this.handleUserEvent(content);
//           break;
//         case 'user_deleted':
//           await this.handleUserDeletion(content);
//           break;
//         default:
//           console.log('Unknown user event type:', content.event_type);
//       }

//       // Acknowledge the message
//       this.userChannel.ack(msg);

//     } catch (error) {
//       console.error('Error processing user message:', error);
//       // Reject the message and don't requeue it
//       this.userChannel.nack(msg, false, false);
//     }
//   }

  /**
   * Set up the consumer for the queue
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
   * Handle user deletion events
   * @param {Object} userData - User data from the message
   */
  async handleUserDeletion(userData) {
    try {
      const userId = userData.user_id || userData.id;
      await db.query(
        'DELETE FROM users_profile WHERE user_service_id = $1',
        [userId]
      );
      console.log(`Deleted user profile for user_id: ${userId}`);
    } catch (error) {
      console.error('Error handling user deletion:', error);
      throw error;
    }
  }

  /**
   * Close all connections
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
      this.userConnected = false;
      console.log('Subscriber connections closed');
    } catch (error) {
      console.error('Error closing subscriber connections:', error);
    }
  }
}

module.exports = MessagingSubscriber;
