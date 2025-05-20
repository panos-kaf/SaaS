const amqp = require('amqplib');

/**
 * Class for handling RabbitMQ connection and publishing request messages
 */
class MessagingPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.requestsExchange = 'requests_exchange';
    this.exchangeType = 'direct';
    this.routingKey = 'new_request';
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
      
      // Assert the exchange - creates the exchange if it doesn't exist
      await this.channel.assertExchange(this.requestsExchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Exchange '${this.requestsExchange}' (${this.exchangeType}) is ready`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ publisher connection:', error);
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
      console.log(`Publisher retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(amqpUrl), delay);
    } else {
      console.error(`Publisher failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
    }
  }

  /**
   * Publish a request to the exchange
   * @param {Object} request - The request object to publish
   * @returns {Promise<boolean>} - Resolves to true if successful, false otherwise
   */
  async publishRequest(request) {
    if (!this.connected) {
      console.error('Not connected to RabbitMQ. Cannot publish request.');
      return false;
    }

    try {
      // Create a message with the request data and add event metadata
      const message = {
        ...request,
        event: 'new_request_created',
        timestamp: new Date().toISOString()
      };

      // Create a Buffer from the JSON string
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      // Publish to the exchange with the routing key
      const result = this.channel.publish(this.requestsExchange, this.routingKey, messageBuffer);
      
      if (result) {
        console.log(`Request published successfully: ${request.request_id}`);
      } else {
        console.warn('Channel buffer is full, applying back pressure');
      }
      
      return result;
    } catch (error) {
      console.error('Error publishing request:', error);
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
      console.log('RabbitMQ publisher connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ publisher connection:', error);
    }
  }
}

// Create and export a singleton instance
const publisher = new MessagingPublisher();

module.exports = publisher;