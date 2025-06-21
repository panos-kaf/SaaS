const amqp = require('amqplib');
const config = require('../config/config');
const MessagingPublisher = require('./publisher');
const MessagingSubscriber = require('./subscriber');

let publisher = null;
let subscriber = null;

/**
 * Initialize the messaging system
 * @returns {Promise<boolean>}
 */
const initializeMessaging = async () => {
  try {
    // Initialize publisher
    publisher = new MessagingPublisher();
    await publisher.init();
    
    // Initialize subscriber
    subscriber = new MessagingSubscriber();
    await subscriber.initSubscribers();
    
    console.log('Institution service messaging system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    return false;
  }
};

/**
 * Close all messaging connections
 * @returns {Promise<void>}
 */
const closeMessaging = async () => {
  try {
    if (publisher) {
      await publisher.close();
    }
    if (subscriber) {
      await subscriber.close();
    }
    console.log('Institution service messaging connections closed');
  } catch (error) {
    console.error('Error closing messaging connections:', error);
  }
};

module.exports = {
  initializeMessaging,
  closeMessaging,
  get publisher() { return publisher; },
  get subscriber() { return subscriber; }
};
