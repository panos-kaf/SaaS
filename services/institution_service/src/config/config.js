/**
 * Configuration settings for the Institution Service
 */
require('dotenv').config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3007,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'postgres',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'institution_db',
  
  // RabbitMQ configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'rabbitmq',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
  
  // Exchange and queue configuration for institutions
  INSTITUTIONS_EXCHANGE: process.env.INSTITUTIONS_EXCHANGE || 'institutions_exchange',
  INSTITUTIONS_ROUTING_KEY: process.env.INSTITUTIONS_ROUTING_KEY || 'new_institution',
  
  // Courses exchange configuration
  COURSES_EXCHANGE: process.env.COURSES_EXCHANGE || 'courses_exchange',
  
  // Users exchange configuration
  USERS_EXCHANGE: process.env.USERS_EXCHANGE || 'users_exchange',
  
  // Service identifiers
  SERVICE_NAME: 'institution-service',

  jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },

  // File upload configuration
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB in bytes
};
