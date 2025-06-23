const express = require('express');
const StatisticsController = require('../controllers/statisticsController');

const router = express.Router();
const statisticsController = new StatisticsController();

// Get statistics for a course - only professors and admins should access this
router.get(
  '/stats/:courseId',
  statisticsController.getStatistics.bind(statisticsController)
);

module.exports = (app) => {
    app.use(router);
};
