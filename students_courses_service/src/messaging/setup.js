const subscriber = require('./subscriber');

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    await subscriber.init();
    console.log('Messaging system initialized');
  } catch (error) {
    console.error('Failed to initialize messaging system:', error);
    // The subscriber has its own retry mechanism, so we don't need to throw here
  }
};

module.exports = {
  initializeMessaging
};
