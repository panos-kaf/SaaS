const publisher = require('./publisher');
const config = require('../config/config');

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    // Get RabbitMQ URL from config or use default
    const amqpUrl = config.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    await publisher.init(amqpUrl);
    console.log('Messaging system initialized');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // The publisher has its own retry mechanism, so we don't need to throw here
  }
};

module.exports = {
  initializeMessaging
};
