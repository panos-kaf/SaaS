// This file defines the route for getting statistics, linking it to the getStatistics method in StatisticsController.

const express = require('express');
const StatisticsController = require('../controllers/statisticsController');

const router = express.Router();
const statisticsController = new StatisticsController();

router.get('/get-stats/:course_ID', statisticsController.getStatistics.bind(statisticsController));

module.exports = router;