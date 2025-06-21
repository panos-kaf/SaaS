const publisher = require('./publisher');
const subscriber = require('./subscriber');
const CoursesSubscriber = require('./coursesSubscriber');
const coursesSubscriber = new CoursesSubscriber();
const config = require('../config/config');

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    // Get RabbitMQ URL from config or use default
    const amqpUrl = config.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    
    // Initialize the publisher
    await publisher.init(amqpUrl);
    
    // Initialize the subscriber
    await subscriber.init(amqpUrl);
    
    // Initialize the courses subscriber
    await coursesSubscriber.init(amqpUrl);
    
    console.log('Messaging system initialized (publisher, subscriber, and courses subscriber)');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // Both publisher and subscriber have their own retry mechanisms
  }
};

module.exports = {
  initializeMessaging,
  publisher,
  subscriber,
  coursesSubscriber
};
