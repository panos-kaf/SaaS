const { 
  getCoursesByUserId, 
  addCourseForUser, 
  getGradeForUserCourse,
  getAllCourses
} = require('../models/queries');

class CoursesController {
  /**
   * Get all courses for a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCourses(req, res) {
    try {
      const userId = parseInt(req.params.user_ID);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const courses = await getCoursesByUserId(userId);
      
      if (courses.length === 0) {
        return res.status(200).json({ 
          message: 'No courses found for this user',
          courses: [] 
        });
      }
      
      return res.status(200).json({ 
        courses, 
        count: courses.length 
      });
    } catch (error) {
      console.error('Error getting courses:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving courses' });
    }
  }
  
  /**
   * Add a course for a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addCourse(req, res) {
    try {
      const userId = parseInt(req.params.user_ID);
      const courseId = parseInt(req.params.course_ID);
      
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid user ID or course ID' });
      }
      
      const result = await addCourseForUser(userId, courseId);
      
      if (result.registered) {
        return res.status(201).json({ 
          message: 'Course added successfully',
          registrationId: result.registrationId
        });
      } else {
        return res.status(200).json({ 
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error adding course:', error);
      
      if (error.message === 'Course not found') {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      return res.status(500).json({ error: 'An error occurred while adding the course' });
    }
  }
  
  /**
   * Get the grade for a specific user and course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getGrade(req, res) {
    try {
      const userId = parseInt(req.params.user_ID);
      const courseId = parseInt(req.params.course_ID);
      
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid user ID or course ID' });
      }
      
      const grade = await getGradeForUserCourse(userId, courseId);
      
      if (!grade) {
        return res.status(404).json({ error: 'Grade not found for this course' });
      }
      
      return res.status(200).json(grade);
    } catch (error) {
      console.error('Error getting grade:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving the grade' });
    }
  }
  
  /**
   * Get all available courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllCourses(req, res) {
    try {
      const courses = await getAllCourses();
      
      return res.status(200).json({ 
        courses, 
        count: courses.length 
      });
    } catch (error) {
      console.error('Error getting all courses:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving courses' });
    }
  }
}

module.exports = new CoursesController();
