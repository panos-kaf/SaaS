const amqp = require('amqplib');

class MessagingPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'grades_exchange';
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
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Exchange '${this.exchangeName}' (${this.exchangeType}) is ready`);
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
   * Publish a grade message to the exchange
   * @param {Object} grade - The grade object to publish
   * @returns {Promise<boolean>} - Resolves to true if successful, false otherwise
   */
  async publishGrade(grade) {
    if (!this.connected) {
      console.error('Not connected to RabbitMQ. Cannot publish message.');
      return false;
    }

    try {
      // Create a Buffer from the JSON string
      const messageBuffer = Buffer.from(JSON.stringify(grade));
      
      // Publish to the exchange
      // Using empty routing key as it's a fanout exchange
      const result = this.channel.publish(this.exchangeName, '', messageBuffer);
      
      if (result) {
        console.log(`Grade published successfully: ${grade.grades_id}`);
      } else {
        console.warn('Channel buffer is full, applying back pressure');
      }
      
      return result;
    } catch (error) {
      console.error('Error publishing grade:', error);
      return false;
    }
  }

  /**
   * Publish multiple grades at once
   * @param {Array<Object>} grades - Array of grade objects to publish
   * @returns {Promise<boolean>} - Resolves to true if all messages were sent, false otherwise
   */
  async publishGrades(grades) {
    if (!Array.isArray(grades) || grades.length === 0) {
      console.warn('No grades provided for publishing');
      return false;
    }

    try {
      let allPublished = true;
      
      for (const grade of grades) {
        const published = await this.publishGrade(grade);
        if (!published) {
          allPublished = false;
        }
      }
      
      return allPublished;
    } catch (error) {
      console.error('Error publishing multiple grades:', error);
      return false;
    }
  }

  /**
   * Publish a notification about a finalized grade submission
   * @param {number} submissionId - The ID of the finalized submission
   * @returns {Promise<boolean>} - Resolves to true if successful, false otherwise
   */
  async publishFinalization(submissionId) {
    if (!this.connected) {
      console.error('Not connected to RabbitMQ. Cannot publish finalization.');
      return false;
    }

    try {
      const message = {
        event: 'grade_submission_finalized',
        submission_id: submissionId,
        timestamp: new Date().toISOString()
      };
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      // Publish to the exchange with a special routing key for finalization events
      // Even though it's a fanout exchange, we can use the routing key for logging/debugging
      const result = this.channel.publish(this.exchangeName, 'finalization', messageBuffer);
      
      if (result) {
        console.log(`Grade submission finalization published: ${submissionId}`);
      } else {
        console.warn('Channel buffer is full, applying back pressure');
      }
      
      return result;
    } catch (error) {
      console.error('Error publishing finalization:', error);
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
