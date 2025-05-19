const express = require('express');
const StatisticsController = require('../controllers/statisticsController');

const router = express.Router();
const statisticsController = new StatisticsController();

router.get('/stats/:course_ID', statisticsController.getStatistics.bind(statisticsController));

module.exports = (app) => {
    app.use('/api', router);
};