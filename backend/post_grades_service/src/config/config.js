/**
 * Configuration settings for the application, primarily loaded from environment variables
 */
module.exports = {
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'postgres',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'grades_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  
  // Server configuration
  PORT: process.env.PORT || 3004, // changed default to 3004
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // RabbitMQ configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  
  // Exchange configurations
  COURSES_EXCHANGE: process.env.COURSES_EXCHANGE || 'courses_exchange',
  COURSES_QUEUE: process.env.COURSES_QUEUE || 'post_grades_courses_queue',
  
  // File upload configuration
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB in bytes

    jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  }
};
