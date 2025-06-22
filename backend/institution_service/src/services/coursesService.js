const db = require('../database/db');
const messaging = require('../messaging/setup');

/**
 * Service for handling courses operations and messaging
 */
class CoursesService {
  /**
   * Create a new course
   * @param {Object} courseData - The course data
   * @returns {Promise<Object>} - The created course
   */
  async createCourse(courseData) {
    const {
      institution_id,
      course_code,
      course_name,
      department,
      semester,
      academic_year,
      professor_id
    } = courseData;

    try {
      // Insert the course
      const result = await db.query(
        `INSERT INTO institution_courses 
         (institution_id, course_code, course_name, department, semester, academic_year, professor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [institution_id, course_code, course_name, department, semester, academic_year, professor_id]
      );

      const course = result.rows[0];

      // Publish course created event
      await this.publishCourseEvent('COURSE_CREATED', course);

      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Update an existing course
   * @param {number} courseId - The course ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated course
   */
  async updateCourse(courseId, updateData) {
    const {
      course_code,
      course_name,
      department,
      semester,
      academic_year,
      professor_id
    } = updateData;

    try {
      const result = await db.query(
        `UPDATE institution_courses 
         SET course_code = COALESCE($2, course_code),
             course_name = COALESCE($3, course_name),
             department = COALESCE($4, department),
             semester = COALESCE($5, semester),
             academic_year = COALESCE($6, academic_year),
             professor_id = COALESCE($7, professor_id)
         WHERE course_id = $1
         RETURNING *`,
        [courseId, course_code, course_name, department, semester, academic_year, professor_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Course not found');
      }

      const course = result.rows[0];

      // Publish course updated event
      await this.publishCourseEvent('COURSE_UPDATED', course);

      return course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete a course
   * @param {number} courseId - The course ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCourse(courseId) {
    try {
      // Get the course data before deletion for the event
      const courseResult = await db.query(
        'SELECT * FROM institution_courses WHERE course_id = $1',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        throw new Error('Course not found');
      }

      const course = courseResult.rows[0];

      // Delete the course
      await db.query(
        'DELETE FROM institution_courses WHERE course_id = $1',
        [courseId]
      );

      // Publish course deleted event
      await this.publishCourseEvent('COURSE_DELETED', course);

      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Get courses by institution
   * @param {number} institutionId - The institution ID
   * @returns {Promise<Array>} - Array of courses
   */
  async getCoursesByInstitution(institutionId) {
    try {
      const result = await db.query(
        'SELECT * FROM institution_courses WHERE institution_id = $1 ORDER BY course_name',
        [institutionId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting courses by institution:', error);
      throw error;
    }
  }

  /**
   * Publish course event to RabbitMQ
   * @param {string} eventType - The type of event
   * @param {Object} courseData - The course data
   * @returns {Promise<void>}
   */
  async publishCourseEvent(eventType, courseData) {
    try {
      const eventData = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        course_data: {
          course_id: courseData.course_id,
          institution_id: courseData.institution_id,
          course_code: courseData.course_code,
          course_name: courseData.course_name,
          department: courseData.department,
          semester: courseData.semester,
          academic_year: courseData.academic_year,
          professor_id: courseData.professor_id,
          created_at: courseData.created_at
        }
      };

      await messaging.publisher.publishCourseEvent(eventData);
      console.log(`Course event published: ${eventType} for course ${courseData.course_id}`);
    } catch (error) {
      console.error('Error publishing course event:', error);
      // Don't throw here to avoid breaking the main operation
    }
  }
}

module.exports = new CoursesService();
