const { 
  getCoursesByUserId, 
  addCourseForUser, 
  getGradeForUserCourse,
  getAllCourses,
  getAvailableInstitutionCoursesByUser
} = require('../models/queries');

const db = require('../db/db');

class CoursesController {
  /**
   * Get all courses for a specific user
   */
  async getCourses(req, res) {
    try {
      
      const userId = req.user.id;
      console.log(" user.id from token:", userId);
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
   */
  async addCourse(req, res) {
    try {
      const userId = req.user.id;
      console.log("➡️ userId from token:", userId);
      const courseId = parseInt(req.params.course_ID);
      
      if (!userId || isNaN(courseId)) {
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
   */
  async getGrade(req, res) {
    try {
      const userId = req.user.id;
      const courseId = parseInt(req.params.course_ID);

      if (isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
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


  async getInstitutionCourses(req, res) {
    try {
      const userId = req.user.id;
      const courses = await getAvailableInstitutionCoursesByUser(userId);
      return res.status(200).json({ courses });
    } catch (error) {
      console.error('Error fetching institution courses:', error);
      return res.status(500).json({ error: 'Failed to fetch institution courses' });
    }
  }
}

module.exports = new CoursesController();
