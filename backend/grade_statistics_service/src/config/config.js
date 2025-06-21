/**
 * Configuration for the grade statistics service
 */
module.exports = {
  // RabbitMQ configuration
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  
  // Database configuration
  DB_USER: process.env.DB_USER || 'your_username',
  DB_HOST: process.env.DB_HOST || 'db',
  DB_NAME: process.env.DB_NAME || 'grade_statistics',
  DB_PASSWORD: process.env.DB_PASSWORD || 'your_password',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  
  // API configuration
  PORT: parseInt(process.env.PORT) || 3003,

    jwt: {
    secret: process.env.JWT_SECRET || 'jwt_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  }
};
