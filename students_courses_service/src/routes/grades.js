const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');

// Get all courses for a specific user
router.get('/get-courses/:user_ID', coursesController.getCourses);

// Add a course for a specific user
router.post('/add-course/:course_ID/:user_ID', coursesController.addCourse);

// Get grade for a specific user and course
router.get('/get-grade/:user_ID/:course_ID', coursesController.getGrade);

// Get all available courses
router.get('/courses', coursesController.getAllCourses);

module.exports = router;
