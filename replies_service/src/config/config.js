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
  
  // Service identifiers
  SERVICE_NAME: 'replies-service'
};