const amqp = require('amqplib');
const config = require('../config/config');
const db = require('../database/db');

/**
 * Subscriber for courses events from institution service
 */
class CoursesSubscriber {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.coursesExchange = config.COURSES_EXCHANGE;
    this.exchangeType = 'fanout';
    this.queueName = config.COURSES_QUEUE;
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
      console.log('Courses subscriber connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ courses subscriber connection error:', err);
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ courses subscriber connection closed');
        this.connected = false;
        this.retryConnection(amqpUrl);
      });

      // Create a channel
      this.channel = await this.connection.createChannel();
      
      // Assert the exchange
      await this.channel.assertExchange(this.coursesExchange, this.exchangeType, {
        durable: true
      });

      // Create a queue for this service
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      // Bind the queue to the exchange
      await this.channel.bindQueue(this.queueName, this.coursesExchange, '');

      // Set up consumer
      await this.channel.consume(this.queueName, this.handleCourseMessage.bind(this), {
        noAck: false
      });

      this.connected = true;
      this.retryCount = 0;
      console.log(`Courses subscriber listening on queue: ${this.queueName}`);

    } catch (error) {
      console.error('Failed to initialize courses subscriber:', error);
      this.connected = false;
      await this.retryConnection(amqpUrl);
    }
  }

  /**
   * Retry connection to RabbitMQ with backoff
   * @param {string} amqpUrl - The URL to connect to RabbitMQ
   */
  async retryConnection(amqpUrl) {
    if (this.retryCount >= this.maxRetries) {
      console.error(`Max retries (${this.maxRetries}) reached for courses subscriber. Giving up.`);
      return;
    }

    this.retryCount++;
    const delay = this.retryInterval * this.retryCount;
    console.log(`Retrying courses subscriber connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

    setTimeout(async () => {
      await this.init(amqpUrl);
    }, delay);
  }

  /**
   * Handle incoming course messages
   * @param {Object} msg - The message from RabbitMQ
   */
  async handleCourseMessage(msg) {
    if (!msg) return;

    try {
      const messageContent = JSON.parse(msg.content.toString());
      console.log('Received course message:', messageContent.event_type);

      switch (messageContent.event_type) {
        case 'COURSE_CREATED':
          await this.handleCourseCreated(messageContent.course_data);
          break;
        case 'COURSE_UPDATED':
          await this.handleCourseUpdated(messageContent.course_data);
          break;
        case 'COURSE_DELETED':
          await this.handleCourseDeleted(messageContent.course_data);
          break;
        default:
          console.log('Unknown course event type:', messageContent.event_type);
      }

      // Acknowledge the message
      this.channel.ack(msg);

    } catch (error) {
      console.error('Error processing course message:', error);
      // Reject and requeue the message for retry
      this.channel.nack(msg, false, true);
    }
  }

  /**
   * Handle course created event
   * @param {Object} courseData - The course data
   */
  async handleCourseCreated(courseData) {
    try {
      await db.query(
        `INSERT INTO institution_courses 
         (course_id, institution_id, course_code, course_name, department, semester, academic_year, professor_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (course_id) DO UPDATE SET
           institution_id = EXCLUDED.institution_id,
           course_code = EXCLUDED.course_code,
           course_name = EXCLUDED.course_name,
           department = EXCLUDED.department,
           semester = EXCLUDED.semester,
           academic_year = EXCLUDED.academic_year,
           professor_id = EXCLUDED.professor_id,
           updated_at = CURRENT_TIMESTAMP`,
        [
          courseData.course_id,
          courseData.institution_id,
          courseData.course_code,
          courseData.course_name,
          courseData.department,
          courseData.semester,
          courseData.academic_year,
          courseData.professor_id,
          courseData.created_at
        ]
      );

      console.log(`Course created/updated in cache: ${courseData.course_id}`);
    } catch (error) {
      console.error('Error handling course created event:', error);
      throw error;
    }
  }

  /**
   * Handle course updated event
   * @param {Object} courseData - The course data
   */
  async handleCourseUpdated(courseData) {
    try {
      const result = await db.query(
        `UPDATE institution_courses SET
           institution_id = $2,
           course_code = $3,
           course_name = $4,
           department = $5,
           semester = $6,
           academic_year = $7,
           professor_id = $8,
           updated_at = CURRENT_TIMESTAMP
         WHERE course_id = $1`,
        [
          courseData.course_id,
          courseData.institution_id,
          courseData.course_code,
          courseData.course_name,
          courseData.department,
          courseData.semester,
          courseData.academic_year,
          courseData.professor_id
        ]
      );

      if (result.rowCount === 0) {
        console.warn(`Course ${courseData.course_id} not found for update, creating it`);
        await this.handleCourseCreated(courseData);
      } else {
        console.log(`Course updated in cache: ${courseData.course_id}`);
      }
    } catch (error) {
      console.error('Error handling course updated event:', error);
      throw error;
    }
  }

  /**
   * Handle course deleted event
   * @param {Object} courseData - The course data
   */
  async handleCourseDeleted(courseData) {
    try {
      await db.query(
        'DELETE FROM institution_courses WHERE course_id = $1',
        [courseData.course_id]
      );

      console.log(`Course deleted from cache: ${courseData.course_id}`);
    } catch (error) {
      console.error('Error handling course deleted event:', error);
      throw error;
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
      console.log('Courses subscriber connection closed');
    } catch (error) {
      console.error('Error closing courses subscriber connection:', error);
    }
  }
}

module.exports = CoursesSubscriber;
