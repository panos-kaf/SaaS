#!/usr/bin/env node

/**
 * Utility script to synchronize existing courses across services
 * This script should be run after implementing the messaging system
 * to ensure all existing courses are synchronized across services.
 */

const { Pool } = require('pg');
const amqp = require('amqplib');

// Configuration for services
const services = {
  institution: {
    DB_HOST: process.env.INSTITUTION_DB_HOST || 'postgres',
    DB_PORT: parseInt(process.env.INSTITUTION_DB_PORT) || 5432,
    DB_USER: process.env.INSTITUTION_DB_USER || 'postgres',
    DB_PASSWORD: process.env.INSTITUTION_DB_PASSWORD || 'postgres',
    DB_NAME: process.env.INSTITUTION_DB_NAME || 'institution_db',
  }
};

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const COURSES_EXCHANGE = 'courses_exchange';

/**
 * Create database connection
 */
function createDbConnection(config) {
  return new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
  });
}

/**
 * Publish course event to RabbitMQ
 */
async function publishCourseEvent(channel, eventType, courseData) {
  const eventMessage = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    course_data: courseData
  };

  const message = JSON.stringify(eventMessage);
  
  channel.publish(
    COURSES_EXCHANGE,
    '', // Empty routing key for fanout exchange
    Buffer.from(message),
    { persistent: true }
  );

  console.log(`Published ${eventType} event for course ${courseData.course_id}`);
}

/**
 * Main synchronization function
 */
async function syncCourses() {
  let institutionDb;
  let connection;
  let channel;

  try {
    console.log('Starting course synchronization...');

    // Connect to institution database
    console.log('Connecting to institution database...');
    institutionDb = createDbConnection(services.institution);

    // Connect to RabbitMQ
    console.log('Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert the courses exchange
    await channel.assertExchange(COURSES_EXCHANGE, 'fanout', { durable: true });

    // Get all courses from institution service
    console.log('Fetching courses from institution service...');
    const coursesResult = await institutionDb.query('SELECT * FROM institution_courses ORDER BY course_id');
    
    if (coursesResult.rows.length === 0) {
      console.log('No courses found to synchronize.');
      return;
    }

    console.log(`Found ${coursesResult.rows.length} courses to synchronize.`);

    // Publish course events for all courses
    let successCount = 0;
    let errorCount = 0;

    for (const course of coursesResult.rows) {
      try {
        await publishCourseEvent(channel, 'COURSE_CREATED', course);
        successCount++;
      } catch (error) {
        console.error(`Failed to publish course ${course.course_id}:`, error);
        errorCount++;
      }
    }

    console.log(`Course synchronization completed:`);
    console.log(`  - Successfully published: ${successCount} courses`);
    console.log(`  - Failed: ${errorCount} courses`);

  } catch (error) {
    console.error('Error during course synchronization:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (institutionDb) {
      await institutionDb.end();
    }
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  }
}

// Run the synchronization
if (require.main === module) {
  syncCourses()
    .then(() => {
      console.log('Course synchronization script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Course synchronization script failed:', error);
      process.exit(1);
    });
}

module.exports = { syncCourses };
