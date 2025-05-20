const publisher = require('./publisher');
const subscriber = require('./subscriber');
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
    
    console.log('Messaging system initialized (publisher and subscriber)');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // Both publisher and subscriber have their own retry mechanisms
  }
};

module.exports = {
  initializeMessaging,
  publisher,
  subscriber
};
