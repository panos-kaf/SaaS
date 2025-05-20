const amqp = require('amqplib');

/**
 * Class for handling the publishing of reply events to RabbitMQ
 */
class Publisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = 'reply_events';
    this.exchangeType = 'direct';
    this.routingKey = 'reply_events';
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
      console.log('Publisher connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ publisher connection error:', err);
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ publisher connection closed');
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Create a channel
      this.channel = await this.connection.createChannel();

      // Assert the exchange - ensures the exchange exists
      await this.channel.assertExchange(this.exchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Publisher initialized with exchange '${this.exchange}'`);
      return true;
    } catch (error) {
      console.error('Failed to initialize RabbitMQ publisher connection:', error);
      this.connected = false;
      this.retryConnection(amqpUrl);
      return false;
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
      console.log(`Publisher retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(amqpUrl), delay);
    } else {
      console.error(`Publisher failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

  /**
   * Publish a reply event
   * @param {string} eventType - Type of event ('reply_created', 'reply_updated', 'reply_deleted')
   * @param {Object} data - Event data to publish
   * @returns {Promise<boolean>} - True if published successfully, false otherwise
   */
  async publishEvent(eventType, data) {
    try {
      if (!this.connected || !this.channel) {
        console.warn('Publisher not connected to RabbitMQ. Cannot publish event.');
        return false;
      }

      // Create event payload
      const eventPayload = {
        event_type: eventType,
        data,
        timestamp: new Date().toISOString()
      };

      // Publish to the exchange
      const success = this.channel.publish(
        this.exchange,
        this.routingKey,
        Buffer.from(JSON.stringify(eventPayload)),
        { persistent: true }
      );

      if (success) {
        console.log(`Published ${eventType} event for reply: ${data.reply_id}`);
      } else {
        console.warn(`Failed to publish ${eventType} event, channel buffer full`);
      }

      return success;
    } catch (error) {
      console.error(`Error publishing ${eventType} event:`, error);
      return false;
    }
  }

  /**
   * Publish a reply created event
   * @param {Object} data - Reply data
   * @returns {Promise<boolean>} - True if published successfully, false otherwise
   */
  async publishReplyCreated(data) {
    return this.publishEvent('reply_created', data);
  }

  /**
   * Publish a reply updated event
   * @param {Object} data - Reply data
   * @returns {Promise<boolean>} - True if published successfully, false otherwise
   */
  async publishReplyUpdated(data) {
    return this.publishEvent('reply_updated', data);
  }

  /**
   * Publish a reply deleted event
   * @param {Object} data - Reply data (must contain reply_id)
   * @returns {Promise<boolean>} - True if published successfully, false otherwise
   */
  async publishReplyDeleted(data) {
    return this.publishEvent('reply_deleted', data);
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
      console.log('RabbitMQ publisher connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ publisher connection:', error);
    }
  }
}

// Create and export a singleton instance
const publisher = new Publisher();
module.exports = publisher;