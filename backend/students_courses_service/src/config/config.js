require('dotenv').config();

module.exports = {
  // Database configuration
  db: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE || 'students_courses_db',
    connectionString: process.env.DATABASE_URL
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3002
  },
  
  // RabbitMQ configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
    gradesExchange: 'grades_exchange',
    exchangeType: 'fanout',
    gradesQueue: 'students_courses_grades_queue',
    usersExchange: 'users_exchange',
    usersQueue: 'students_courses_users_queue',
    coursesExchange: 'courses_exchange',
    coursesQueue: 'students_courses_courses_queue'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'gateway_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  }
};
