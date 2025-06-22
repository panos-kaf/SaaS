const publisher = require('./publisher');
const subscriber = require('./subscriber');
const config = require('../config/config');

/**
 * Initialize all messaging connections
 * @param {string} amqpUrl - The URL to connect to RabbitMQ
 * @returns {Promise<boolean>} - True if all connections are established successfully
 */
const initMessaging = async (amqpUrl = config.RABBITMQ_URL) => {
  try {
    // Initialize the publisher
    const publisherInitialized = await publisher.init(amqpUrl);
    if (!publisherInitialized) {
      console.error('Failed to initialize publisher');
      return false;
    }
    
    // Initialize the subscribers
    await subscriber.initSubscribers();
    
    console.log('All messaging connections initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
    return false;
  }
};

/**
 * Close all messaging connections
 * @returns {Promise<void>}
 */
const closeMessaging = async () => {
  try {
    await publisher.close();
    await subscriber.close();
    console.log('All messaging connections closed');
  } catch (error) {
    console.error('Error closing messaging connections:', error);
  }
};

module.exports = {
  initMessaging,
  closeMessaging,
  publisher,
  subscriber
};