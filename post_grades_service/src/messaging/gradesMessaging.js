const publisher = require('./publisher');
const db = require('../database/db');

/**
 * Service for handling all messaging related to grades
 */
class GradesMessagingService {
  /**
   * Publish a single grade to the message queue
   * @param {Object} grade - The grade object
   * @returns {Promise<boolean>} - Success status
   */
  async publishGrade(grade) {
    return await publisher.publishGrade(grade);
  }

  /**
   * Publish a notification about a finalized grade submission
   * @param {number} submissionId - The ID of the finalized submission
   * @returns {Promise<boolean>} - Success status
   */
  async publishFinalization(submissionId) {
    return await publisher.publishFinalization(submissionId);
  }

  /**
   * Publish all grades related to a specific submission
   * @param {number} submissionId - The ID of the submission
   * @returns {Promise<boolean>} - Success status
   */
  async publishSubmissionGrades(submissionId) {
    try {
      // Fetch all grades related to the submission
      const result = await db.query(
        'SELECT * FROM grades WHERE submission_id = $1',
        [submissionId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`No grades found for submission ID: ${submissionId}`);
        return false;
      }
      
      // Publish each grade
      return await publisher.publishGrades(result.rows);
    } catch (error) {
      console.error('Error publishing submission grades:', error);
      return false;
    }
  }

  /**
   * Publish all grades related to a specific student
   * @param {string} studentAcademicNumber - The academic number of the student
   * @returns {Promise<boolean>} - Success status
   */
  async publishStudentGrades(studentAcademicNumber) {
    try {
      // Fetch all grades for the student
      const result = await db.query(
        'SELECT * FROM grades WHERE student_academic_number = $1',
        [studentAcademicNumber]
      );
      
      if (result.rows.length === 0) {
        console.warn(`No grades found for student with academic number: ${studentAcademicNumber}`);
        return false;
      }
      
      // Publish each grade
      return await publisher.publishGrades(result.rows);
    } catch (error) {
      console.error('Error publishing student grades:', error);
      return false;
    }
  }

  /**
   * Publish all grades related to a specific course
   * @param {string} courseId - The ID of the course
   * @returns {Promise<boolean>} - Success status
   */
  async publishCourseGrades(courseId) {
    try {
      // Fetch all grades for the course
      const result = await db.query(
        'SELECT * FROM grades WHERE course_id = $1',
        [courseId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`No grades found for course ID: ${courseId}`);
        return false;
      }
      
      // Publish each grade
      return await publisher.publishGrades(result.rows);
    } catch (error) {
      console.error('Error publishing course grades:', error);
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new GradesMessagingService();
