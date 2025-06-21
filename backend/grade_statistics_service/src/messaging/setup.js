const subscriber = require('./subscriber');
const CoursesSubscriber = require('./coursesSubscriber');
const config = require('../config/config');

// Create courses subscriber instance
const coursesSubscriber = new CoursesSubscriber();

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    // Get RabbitMQ URL from config or use default
    const amqpUrl = config.RABBITMQ_URL;
    await subscriber.init(amqpUrl);
    await coursesSubscriber.init(amqpUrl);
    console.log('Messaging system initialized (subscriber and courses subscriber)');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // The subscribers have their own retry mechanisms, so we don't need to throw here
  }
};

module.exports = {
  initializeMessaging,
  coursesSubscriber
};
