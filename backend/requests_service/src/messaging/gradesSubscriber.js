const amqp = require('amqplib');
const db = require('../database/db');

/**
 * Class for handling RabbitMQ connection and consuming grade messages
 */
class GradesSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.gradesExchange = 'grades_exchange';
    this.exchangeType = 'fanout';
    this.queueName = 'requests_grades_queue';
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
      console.log('Grades subscriber connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ grades subscriber connection error:', err);
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ grades subscriber connection closed');
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      
      // Assert the exchange - ensures the exchange exists
      await this.channel.assertExchange(this.gradesExchange, this.exchangeType, {
        durable: true // Exchange will survive broker restart
      });

      // Create a queue for this service
      const q = await this.channel.assertQueue(this.queueName, {
        durable: true, // Queue will survive broker restart
        exclusive: false
      });

      // Bind the queue to the exchange
      await this.channel.bindQueue(q.queue, this.gradesExchange, '');
      console.log(`Queue '${q.queue}' bound to exchange '${this.gradesExchange}'`);

      // Set up consumer
      await this.setupConsumer(q.queue);

      this.connected = true;
      this.retryCount = 0; // Reset retry count on successful connection
      console.log(`Grades subscriber is ready to consume messages from queue '${q.queue}'`);
    } catch (error) {
      console.error('Failed to initialize RabbitMQ grades subscriber connection:', error);
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
      console.log(`Grades subscriber retrying connection in ${delay}ms (attempt ${this.retryCount} of ${this.maxRetries})`);
      setTimeout(() => this.init(amqpUrl), delay);
    } else {
      console.error(`Grades subscriber failed to connect to RabbitMQ after ${this.maxRetries} attempts. Giving up.`);
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
            
            // Check if the message is a grade or a finalization event
            if (content.event === 'grade_submission_finalized') {
              console.log(`Received grade submission finalization message: ${content.submission_id}`);
              // Currently we don't need special handling for finalization events
            } else if (content.id || content.grades_id || content.student_academic_number) {
              // This is a grade message - handle different field patterns
              // Some messages have ID fields, others are identified by having grade data
              const gradeId = content.id || content.grades_id || 'unknown';
              console.log(`Received grade message for grade ID: ${gradeId}`);
              // Process the grade message
              await this.processGradeMessage(content);
            } else {
              console.warn('Received unknown message format:', content);
            }
            
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
      console.error('Error setting up grades consumer:', error);
    }
  }

  /**
   * Process a grade message
   * @param {Object} gradeData - The grade object
   * @returns {Promise<void>}
   */
  async processGradeMessage(gradeData) {
    try {
      // Handle both 'id' and 'grades_id' field names from the message
      let gradeServiceId = gradeData.id || gradeData.grades_id;
      
      // If no explicit ID, create a composite key for identification
      if (!gradeServiceId) {
        // Create a pseudo-ID based on student + course + submission for duplicate detection
        gradeServiceId = `${gradeData.student_academic_number}-${gradeData.course_code}-${gradeData.submission_id || 'nosub'}`;
        console.log(`No explicit grade ID found, using composite identifier: ${gradeServiceId}`);
      } else {
        console.log(`Processing grade data for grade service ID: ${gradeServiceId}`);
      }
      
      // Validate required fields
      const requiredFields = ['student_academic_number', 'student_name', 'semester', 'course_name', 'course_code', 'grade_scale', 'grade'];
      for (const field of requiredFields) {
        if (!gradeData[field]) {
          console.error(`Missing required field '${field}' in grade message:`, gradeData);
          return;
        }
      }
      
      // Check if grade already exists in our database
      const gradeCheck = await db.query(
        'SELECT * FROM grades WHERE grades_service_id = $1',
        [gradeServiceId.toString()]
      );
      
      if (gradeCheck.rows.length === 0) {
        // Insert new grade
        await db.query(
          `INSERT INTO grades (
            grades_service_id, course_id, prof_id, student_academic_number, 
            student_name, student_email, semester, academic_year, course_name, 
            course_code, grade_scale, grade, submission_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            gradeServiceId.toString(),
            gradeData.course_id || null,
            gradeData.prof_id || gradeData.professor_id || null,
            gradeData.student_academic_number,
            gradeData.student_name,
            gradeData.student_email || null,
            gradeData.semester,
            gradeData.academic_year || null,
            gradeData.course_name,
            gradeData.course_code,
            gradeData.grade_scale,
            gradeData.grade.toString(),
            gradeData.submission_id || null
          ]
        );
        console.log(`Inserted new grade for grade service ID: ${gradeServiceId}`);
      } else {
        // Update existing grade
        await db.query(
          `UPDATE grades SET 
            course_id = $2,
            prof_id = $3,
            student_academic_number = $4,
            student_name = $5,
            student_email = $6,
            semester = $7,
            academic_year = $8,
            course_name = $9,
            course_code = $10,
            grade_scale = $11,
            grade = $12,
            submission_id = $13,
            updated_at = CURRENT_TIMESTAMP
          WHERE grades_service_id = $1`,
          [
            gradeServiceId.toString(),
            gradeData.course_id || null,
            gradeData.prof_id || gradeData.professor_id || null,
            gradeData.student_academic_number,
            gradeData.student_name,
            gradeData.student_email || null,
            gradeData.semester,
            gradeData.academic_year || null,
            gradeData.course_name,
            gradeData.course_code,
            gradeData.grade_scale,
            gradeData.grade.toString(),
            gradeData.submission_id || null
          ]
        );
        console.log(`Updated grade for grade service ID: ${gradeServiceId}`);
      }
    } catch (error) {
      console.error('Error processing grade message:', error);
      console.error('Grade data that caused error:', gradeData);
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
      console.log('RabbitMQ grades subscriber connection closed gracefully');
    } catch (error) {
      console.error('Error closing RabbitMQ grades subscriber connection:', error);
    }
  }
}

// Create and export a singleton instance
const gradesSubscriber = new GradesSubscriber();

module.exports = gradesSubscriber;