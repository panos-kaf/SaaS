const subscriber = require('./subscriber');
const config = require('../config/config');

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    // Get RabbitMQ URL from config or use default
    const amqpUrl = config.RABBITMQ_URL;
    await subscriber.init(amqpUrl);
    console.log('Messaging subscriber initialized');
  } catch (error) {
    console.error('Failed to initialize messaging subscriber:', error);
    // The subscriber has its own retry mechanism, so we don't need to throw here
  }
};

module.exports = {
  initializeMessaging
};
