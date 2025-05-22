const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Get all courses for a specific user - user can only access their own courses
router.get(
  '/get-courses',
  authenticateJWT,
  coursesController.getCourses
);

// Add a course for a specific user - professors and admins only
router.post(
  '/add-course/:course_ID',
  authenticateJWT,
  authorizeRoles(['professor', 'admin']),
  coursesController.addCourse
);

// Get grade for a specific user and course
router.get(
  '/get-grade/:course_ID',
  authenticateJWT,
  coursesController.getGrade
);

// Get all available courses - available to all authenticated users
router.get(
  '/courses',
  authenticateJWT,
  coursesController.getAllCourses
);

module.exports = router;
