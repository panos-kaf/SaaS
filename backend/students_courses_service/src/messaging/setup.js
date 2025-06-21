const subscriber = require('./subscriber');
const CoursesSubscriber = require('./coursesSubscriber');

// Create courses subscriber instance
const coursesSubscriber = new CoursesSubscriber();

/**
 * Initialize the messaging system
 * @returns {Promise<void>}
 */
const initializeMessaging = async () => {
  try {
    await subscriber.init();
    await coursesSubscriber.init();
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
