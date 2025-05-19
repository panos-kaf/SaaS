const amqp = require('amqplib');
const config = require('../config/config');
const { saveGradeFromQueue } = require('../models/queries');

class MessagingSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.gradesExchange = config.rabbitmq.gradesExchange;
    this.exchangeType = config.rabbitmq.exchangeType;
    this.gradesQueue = config.rabbitmq.gradesQueue;
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
      
      // Assert the exchange - ensures the exchange exists
      await this.channel.assertExchange(this.gradesExchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      // Create a queue for this service
      const q = await this.channel.assertQueue(this.gradesQueue, {
        durable: true, // Queue will survive broker restart
        exclusive: false
      });

      // Bind the queue to the exchange
      await this.channel.bindQueue(q.queue, this.gradesExchange, '');
      console.log(`Queue '${q.queue}' bound to exchange '${this.gradesExchange}'`);

      // Set up consumer
      await this.setupGradesConsumer(q.queue);

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Subscriber is ready to consume messages from queue '${q.queue}'`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ connection:', error);
      this.connected = false;
      this.retryConnection();
    }
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
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received grade message for student: ${content.student_academic_number}, course: ${content.course_code}`);
            
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
    } catch (error) {
      console.error('Error setting up consumer:', error);
    }
  }

  /**
   * Process a grade message
   * @param {Object} grade - The grade object
   */
  async processGradeMessage(grade) {
    try {
      // Save the grade to the database
      const result = await saveGradeFromQueue(grade);
      
      if (result.inserted) {
        console.log(`Inserted new grade for student ${grade.student_academic_number}, course ${grade.course_code}`);
      } else if (result.updated) {
        console.log(`Updated existing grade for student ${grade.student_academic_number}, course ${grade.course_code}`);
      }
    } catch (error) {
      console.error('Error processing grade message:', error);
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
