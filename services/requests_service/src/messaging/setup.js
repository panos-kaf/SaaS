const subscriber = require('./subscriber');
const publisher = require('./publisher');
const gradesSubscriber = require('./gradesSubscriber');
const config = require('../config/config');

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    // Get RabbitMQ URL from config
    const amqpUrl = config.RABBITMQ_URL;
    
    // Initialize the user profile subscriber
    await subscriber.init(amqpUrl);
    
    // Initialize the grades subscriber
    await gradesSubscriber.init(amqpUrl);
    
    // Initialize the publisher
    await publisher.init(amqpUrl);
    
    console.log('Messaging system initialized completely');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // All components have their own retry mechanisms
  }
};

module.exports = {
  initializeMessaging,
  subscriber,
  publisher,
  gradesSubscriber
};