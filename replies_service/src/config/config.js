// Environment variables with defaults
module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3006,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'db',
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,
  POSTGRES_DB: process.env.POSTGRES_DB || 'repliesdb',
  POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  
  // RabbitMQ configuration
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'rabbitmq',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  
  // Exchange and routing keys for RabbitMQ
  USERS_EXCHANGE: process.env.USERS_EXCHANGE || 'users_exchange',
  REQUESTS_EXCHANGE: process.env.REQUESTS_EXCHANGE || 'requests_exchange',
  REQUESTS_ROUTING_KEY: process.env.REQUESTS_ROUTING_KEY || 'new_request',
  
  // Service identifiers
  SERVICE_NAME: 'replies-service'
};