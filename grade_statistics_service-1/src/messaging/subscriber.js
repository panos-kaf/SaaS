const amqp = require('amqplib');
const db = require('../database/db');

class MessagingSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'grades_exchange';
    this.exchangeType = 'fanout';
    this.queueName = 'grade_statistics_queue';
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
      
      // Assert the exchange - ensures the exchange exists
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      // Create a queue for this service
      const q = await this.channel.assertQueue(this.queueName, {
        durable: true, // Queue will survive broker restart
        exclusive: false
      });

      // Bind the queue to the exchange
      await this.channel.bindQueue(q.queue, this.exchangeName, '');
      console.log(`Queue '${q.queue}' bound to exchange '${this.exchangeName}'`);

      // Set up consumer
      await this.setupConsumer(q.queue);

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Subscriber is ready to consume messages from queue '${q.queue}'`);
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
   * Set up the consumer for the queue
   * @param {string} queue - The queue to consume from
   */
  async setupConsumer(queue) {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received grade message: ${content.grades_id}`);
            
            // Process the message
            await this.processGradeMessage(content);
            
            // Acknowledge the message
            this.channel.ack(msg);
          } catch (err) {
            console.error('Error processing message:', err);
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
   * @returns {Promise<void>}
   */
  async processGradeMessage(grade) {
    try {
      console.log(`Processing grade with ID: ${grade.grades_id}`);
      
      // Check if this grade submission exists
      const submissionCheck = await db.query(
        'SELECT * FROM grade_submissions WHERE submission_id = $1',
        [grade.submission_id]
      );
      
      // If submission doesn't exist, create it
      if (submissionCheck.rows.length === 0) {
        await db.query(
          'INSERT INTO grade_submissions (submission_id, course_id, prof_id, semester, submission_date) VALUES ($1, $2, $3, $4, $5)',
          [grade.submission_id, grade.course_id, grade.prof_id, grade.semester, new Date()]
        );
      }
      
      // Check if grade already exists
      const gradeCheck = await db.query(
        'SELECT * FROM grades WHERE grades_id = $1',
        [grade.grades_id]
      );
      
      if (gradeCheck.rows.length === 0) {
        // Insert new grade
        await db.query(
          `INSERT INTO grades (
            grades_id, course_id, prof_id, student_academic_number, 
            student_name, student_email, semester, course_name, 
            course_code, grade_scale, grade, submission_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            grade.grades_id, grade.course_id, grade.prof_id, 
            grade.student_academic_number, grade.student_name, 
            grade.student_email, grade.semester, grade.course_name, 
            grade.course_code, grade.grade_scale, grade.grade, 
            grade.submission_id
          ]
        );
        console.log(`Inserted new grade with ID: ${grade.grades_id}`);
      } else {
        // Update existing grade
        await db.query(
          `UPDATE grades SET 
            course_id = $2, prof_id = $3, student_academic_number = $4,
            student_name = $5, student_email = $6, semester = $7,
            course_name = $8, course_code = $9, grade_scale = $10,
            grade = $11, submission_id = $12, updated_at = CURRENT_TIMESTAMP
          WHERE grades_id = $1`,
          [
            grade.grades_id, grade.course_id, grade.prof_id, 
            grade.student_academic_number, grade.student_name, 
            grade.student_email, grade.semester, grade.course_name, 
            grade.course_code, grade.grade_scale, grade.grade, 
            grade.submission_id
          ]
        );
        console.log(`Updated grade with ID: ${grade.grades_id}`);
      }
      
      // Update statistics
      await this.updateStatistics(grade.course_id);
    } catch (error) {
      console.error('Error processing grade message:', error);
      throw error;
    }
  }

  /**
   * Update statistics for a course
   * @param {string} courseId - The ID of the course
   * @returns {Promise<void>}
   */
  async updateStatistics(courseId) {
    try {
      // Get all grades for the course
      const gradesResult = await db.query(
        'SELECT grade FROM grades WHERE course_id = $1',
        [courseId]
      );
      
      if (gradesResult.rows.length === 0) {
        console.warn(`No grades found for course ${courseId}`);
        return;
      }
      
      // Convert grades to numbers if possible
      const numericGrades = gradesResult.rows
        .map(row => parseFloat(row.grade))
        .filter(grade => !isNaN(grade));
      
      if (numericGrades.length === 0) {
        console.warn(`No numeric grades found for course ${courseId}`);
        return;
      }
      
      // Calculate statistics
      const count = numericGrades.length;
      const sum = numericGrades.reduce((a, b) => a + b, 0);
      const avg = sum / count;
      const min = Math.min(...numericGrades);
      const max = Math.max(...numericGrades);
      
      // Calculate standard deviation
      const squareDiffs = numericGrades.map(grade => Math.pow(grade - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / count;
      const stdDev = Math.sqrt(avgSquareDiff);
      
      // Check if statistics exist for this course
      const statsCheck = await db.query(
        'SELECT * FROM grade_statistics WHERE course_id = $1',
        [courseId]
      );
      
      if (statsCheck.rows.length === 0) {
        // Insert new statistics
        await db.query(
          `INSERT INTO grade_statistics (
            course_id, count, average, minimum, maximum, std_deviation, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [courseId, count, avg, min, max, stdDev]
        );
      } else {
        // Update existing statistics
        await db.query(
          `UPDATE grade_statistics SET 
            count = $2, average = $3, minimum = $4, maximum = $5, 
            std_deviation = $6, last_updated = CURRENT_TIMESTAMP
          WHERE course_id = $1`,
          [courseId, count, avg, min, max, stdDev]
        );
      }
      
      console.log(`Updated statistics for course ${courseId}`);
    } catch (error) {
      console.error('Error updating statistics:', error);
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
