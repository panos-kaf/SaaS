const amqp = require('amqplib');
const config = require('../config/config');

/**
 * Class for handling RabbitMQ connection and publishing institution messages
 */
class MessagingPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.institutionsExchange = config.INSTITUTIONS_EXCHANGE;
    this.coursesExchange = config.COURSES_EXCHANGE;
    this.exchangeType = 'direct';
    this.coursesExchangeType = 'fanout';
    this.routingKey = config.INSTITUTIONS_ROUTING_KEY;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  /**
   * Initialize the connection to RabbitMQ
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   * @returns {Promise<void>}
   */
  async init(amqpUrl = config.RABBITMQ_URL) {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(amqpUrl);
      console.log('Publisher connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error (Publisher):', err);
        this.connected = false;
        this.retryConnection();
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed (Publisher)');
        this.connected = false;
        this.retryConnection();
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      console.log('Publisher channel created');

      // Declare the exchanges
      await this.channel.assertExchange(this.institutionsExchange, this.exchangeType, { durable: true });
      console.log(`Exchange '${this.institutionsExchange}' declared`);
      
      await this.channel.assertExchange(this.coursesExchange, this.coursesExchangeType, { durable: true });
      console.log(`Exchange '${this.coursesExchange}' declared`);

      this.connected = true;
      this.retryCount = 0;

    } catch (error) {
      console.error('Failed to initialize RabbitMQ publisher:', error);
      this.connected = false;
      await this.retryConnection();
    }
  }

  /**
   * Retry connection to RabbitMQ with backoff
   * @returns {Promise<void>}
   */
  async retryConnection() {
    if (this.retryCount >= this.maxRetries) {
      console.error(`Max retries (${this.maxRetries}) reached. Giving up on RabbitMQ connection.`);
      return;
    }

    this.retryCount++;
    const delay = this.retryInterval * this.retryCount;
    console.log(`Retrying RabbitMQ connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

    setTimeout(async () => {
      await this.init();
    }, delay);
  }

  /**
   * Publish an institution event message
   * @param {Object} eventData - The event data to publish
   * @returns {Promise<boolean>}
   */
  async publishInstitutionEvent(eventData) {
    if (!this.connected || !this.channel) {
      console.warn('Publisher not connected. Cannot publish institution event.');
      return false;
    }

    try {
      const message = JSON.stringify(eventData);
      
      this.channel.publish(
        this.institutionsExchange,
        this.routingKey,
        Buffer.from(message),
        { persistent: true }
      );

      console.log('Institution event published:', eventData.event_type);
      return true;
    } catch (error) {
      console.error('Failed to publish institution event:', error);
      return false;
    }
  }

  /**
   * Publish a course event message
   * @param {Object} courseData - The course data to publish
   * @returns {Promise<boolean>}
   */
  async publishCourseEvent(courseData) {
    if (!this.connected || !this.channel) {
      console.warn('Publisher not connected. Cannot publish course event.');
      return false;
    }

    try {
      const message = JSON.stringify(courseData);
      
      this.channel.publish(
        this.coursesExchange,
        '', // Empty routing key for fanout exchange
        Buffer.from(message),
        { persistent: true }
      );

      console.log('Course event published:', courseData.event_type);
      return true;
    } catch (error) {
      console.error('Failed to publish course event:', error);
      return false;
    }
  }

  /**
   * Close the connection
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
      console.log('Publisher connection closed');
    } catch (error) {
      console.error('Error closing publisher connection:', error);
    }
  }
}

module.exports = MessagingPublisher;
