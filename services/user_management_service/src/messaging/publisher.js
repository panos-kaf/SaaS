const amqp = require('amqplib');
const config = require('../config/config');

/**
 * Class for handling RabbitMQ connection and publishing user profile messages
 */
class MessagingPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.usersExchange = 'users_exchange';
    this.exchangeType = 'fanout';
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
      console.log('Connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      
      // Assert the exchange - creates the exchange if it doesn't exist
      await this.channel.assertExchange(this.usersExchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Exchange '${this.usersExchange}' (${this.exchangeType}) is ready`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ connection:', error);
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
      console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(amqpUrl), delay);
    } else {
      console.error(`Failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

  /**
   * Publish a user profile to the exchange
   * @param {Object} userProfile - The user profile object to publish
   * @returns {Promise<boolean>} - Resolves to true if successful, false otherwise
   */
  async publishUserProfile(userProfile) {
    if (!this.connected) {
      console.error('Not connected to RabbitMQ. Cannot publish user profile.');
      return false;
    }

    try {
      // Clean up the user profile to remove sensitive data
      const sanitizedProfile = {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        role: userProfile.role,
        academic_id: userProfile.academic_id,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        institution_id: userProfile.institution_id,
        department: userProfile.department,
        event: 'user_profile_updated', // Add an event type for subscribers
        timestamp: new Date().toISOString()
      };

      // Create a Buffer from the JSON string
      const messageBuffer = Buffer.from(JSON.stringify(sanitizedProfile));
      
      // Publish to the exchange with an empty routing key (fanout doesn't use routing keys)
      const result = this.channel.publish(this.usersExchange, '', messageBuffer);
      
      if (result) {
        console.log(`User profile published successfully for user: ${userProfile.username}`);
      } else {
        console.warn('Channel buffer is full, applying back pressure');
      }
      
      return result;
    } catch (error) {
      console.error('Error publishing user profile:', error);
      return false;
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
const publisher = new MessagingPublisher();

module.exports = publisher;