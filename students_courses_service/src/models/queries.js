const db = require('../db/db');

/**
 * Get all courses for a specific user/student
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} - Array of courses
 */
async function getCoursesByUserId(userId) {
  try {
    const result = await db.query(`
      SELECT c.course_id, c.course_code, c.course_name, c.department, c.semester
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      WHERE sc.user_id = $1
      ORDER BY c.course_name
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting courses for user:', error);
    throw error;
  }
}

/**
 * Add a course for a specific user/student
 * @param {number} userId - The user ID
 * @param {number} courseId - The course ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function addCourseForUser(userId, courseId) {
  try {
    // First, check if the course exists
    const courseCheck = await db.query('SELECT course_id FROM courses WHERE course_id = $1', [courseId]);
    
    if (courseCheck.rows.length === 0) {
      throw new Error('Course not found');
    }
    
    // Check if the user already has this course
    const existingRegistration = await db.query(
      'SELECT registration_id FROM student_courses WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (existingRegistration.rows.length > 0) {
      // User already registered for this course
      return { registered: false, message: 'Already registered for this course' };
    }
    
    // Add the course for the user
    const result = await db.query(
      'INSERT INTO student_courses (user_id, course_id) VALUES ($1, $2) RETURNING registration_id',
      [userId, courseId]
    );
    
    return { 
      registered: true, 
      registrationId: result.rows[0].registration_id 
    };
  } catch (error) {
    console.error('Error adding course for user:', error);
    throw error;
  }
}

/**
 * Get the grade for a specific user and course
 * @param {number} userId - The user ID
 * @param {number} courseId - The course ID
 * @returns {Promise<Object|null>} - Grade information or null if not found
 */
async function getGradeForUserCourse(userId, courseId) {
  try {
    const result = await db.query(`
      SELECT g.grade_id, g.grade, g.grade_scale, g.submission_date,
             c.course_code, c.course_name, c.department, c.semester,
             u.full_name as student_name, u.academic_number
      FROM grades g
      JOIN courses c ON g.course_id = c.course_id
      JOIN users u ON g.user_id = u.user_id
      WHERE g.user_id = $1 AND g.course_id = $2
      ORDER BY g.submission_date DESC
      LIMIT 1
    `, [userId, courseId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting grade for user course:', error);
    throw error;
  }
}

/**
 * Save a grade received from the message queue
 * @param {Object} gradeData - Grade data object
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveGradeFromQueue(gradeData) {
  try {
    // First ensure the user exists
    let userResult = await db.query(
      'SELECT user_id FROM users WHERE academic_number = $1',
      [gradeData.student_academic_number]
    );
    
    if (userResult.rows.length === 0) {
      // User doesn't exist, create it
      userResult = await db.query(`
        INSERT INTO users (
          username, email, full_name, role, academic_number, department
        ) VALUES (
          $1, $2, $3, 'student', $4, $5
        ) RETURNING user_id`,
        [
          gradeData.student_academic_number, // Using academic number as username
          gradeData.student_email || `${gradeData.student_academic_number}@example.com`,
          gradeData.student_name,
          gradeData.student_academic_number,
          '' // Department might not be available
        ]
      );
    }
    
    const userId = userResult.rows[0].user_id;
    
    // Ensure the course exists
    let courseResult = await db.query(
      'SELECT course_id FROM courses WHERE course_code = $1',
      [gradeData.course_code]
    );
    
    if (courseResult.rows.length === 0) {
      // Course doesn't exist, create it
      courseResult = await db.query(`
        INSERT INTO courses (
          course_code, course_name, department, semester
        ) VALUES (
          $1, $2, $3, $4
        ) RETURNING course_id`,
        [
          gradeData.course_code,
          gradeData.course_name,
          '', // Department might not be available
          gradeData.semester
        ]
      );
    }
    
    const courseId = courseResult.rows[0].course_id;
    
    // Check if the user is registered for this course
    const registrationCheck = await db.query(
      'SELECT registration_id FROM student_courses WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (registrationCheck.rows.length === 0) {
      // Automatically register the student for this course
      await db.query(
        'INSERT INTO student_courses (user_id, course_id) VALUES ($1, $2)',
        [userId, courseId]
      );
    }
    
    // Check if this grade already exists
    const gradeCheck = await db.query(`
      SELECT grade_id FROM grades 
      WHERE user_id = $1 AND course_id = $2 AND submission_id = $3`,
      [userId, courseId, gradeData.submission_id]
    );
    
    if (gradeCheck.rows.length > 0) {
      // Update existing grade
      await db.query(`
        UPDATE grades SET
          grade = $1,
          grade_scale = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE grade_id = $3`,
        [
          gradeData.grade,
          gradeData.grade_scale,
          gradeCheck.rows[0].grade_id
        ]
      );
      
      return { 
        updated: true, 
        gradeId: gradeCheck.rows[0].grade_id 
      };
    } else {
      // Insert new grade
      const result = await db.query(`
        INSERT INTO grades (
          user_id, course_id, grade, grade_scale, submission_id, 
          submitted_by, submission_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING grade_id`,
        [
          userId,
          courseId,
          gradeData.grade,
          gradeData.grade_scale,
          gradeData.submission_id,
          null, // submitted_by might not be available
          new Date(gradeData.created_at || Date.now())
        ]
      );
      
      return { 
        inserted: true, 
        gradeId: result.rows[0].grade_id 
      };
    }
  } catch (error) {
    console.error('Error saving grade from queue:', error);
    throw error;
  }
}

/**
 * Get all available courses
 * @returns {Promise<Array>} - Array of all courses
 */
async function getAllCourses() {
  try {
    const result = await db.query(`
      SELECT course_id, course_code, course_name, department, semester
      FROM courses
      ORDER BY course_name
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all courses:', error);
    throw error;
  }
}

module.exports = {
  getCoursesByUserId,
  addCourseForUser,
  getGradeForUserCourse,
  saveGradeFromQueue,
  getAllCourses
};
