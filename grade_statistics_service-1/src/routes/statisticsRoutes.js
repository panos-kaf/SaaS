const express = require('express');
const StatisticsController = require('../controllers/statisticsController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const statisticsController = new StatisticsController();

// Get statistics for a course - only professors and admins should access this
router.get(
  '/stats/:course_ID',
  authenticateJWT,
  authorizeRoles(['professor', 'admin']),
  statisticsController.getStatistics.bind(statisticsController)
);

module.exports = (app) => {
    app.use('/api', router);
};