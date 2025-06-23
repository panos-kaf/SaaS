const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
//const { authorizeRoles } = require('../middleware/auth');

// Get all courses for a specific user - user can only access their own courses
router.get(
  '/get-courses',
  coursesController.getCourses
);

router.get('/institution-student-courses', coursesController.getInstitutionCourses);

// Add a course for a specific user - professors and admins only
router.post(
  '/add-course/:course_ID',
  //authorizeRoles(['professor', 'admin']),
  coursesController.addCourse
);

// Get grade for a specific user and course
router.get(
  '/get-grade/:course_ID',
  coursesController.getGrade
);

// Get all available courses - available to all authenticated users
router.get(
  '/courses',
  coursesController.getAllCourses
);

router.get('/auth/test', (req, res) => {
  // If this runs, your token and header are correct
  res.status(200).json({ 
    message: 'Token is valid!',
    user: req.user // shows the decoded token payload
  });
});

module.exports = router;
