/**
 * Configuration settings for the Requests Service
 */
require('dotenv').config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3005,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'postgres',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'requests_db',
  
  // RabbitMQ configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'rabbitmq',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
  
  // Exchange and queue configuration for requests
  REQUESTS_EXCHANGE: process.env.REQUESTS_EXCHANGE || 'requests_exchange',
  REQUESTS_ROUTING_KEY: process.env.REQUESTS_ROUTING_KEY || 'new_request',
  
  // Service identifiers
  SERVICE_NAME: 'requests-service',

    jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  }
};