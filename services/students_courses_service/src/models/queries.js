const db = require('../db/db');

/**
 * Get all courses for a specific user/student
 * @param {number} userProfileId - The user profile ID
 * @returns {Promise<Array>} - Array of courses
 */
async function getCoursesByUserId(userProfileId) {
  try {
    const result = await db.query(`
      SELECT c.course_id, c.course_code, c.course_name, c.department, c.semester
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      WHERE sc.user_profile_id = $1
      ORDER BY c.course_name
    `, [userProfileId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting courses for user:', error);
    throw error;
  }
}

/**
 * Add a course for a specific user/student
 * @param {number} userProfileId - The user profile ID
 * @param {number} courseId - The course ID
 * @returns {Promise<Object>} - Result of the operation
 */
async function addCourseForUser(userProfileId, courseId) {
  try {
    // First, check if the course exists in the institution_courses table
    const courseCheck = await db.query('SELECT course_id FROM institution_courses WHERE course_id = $1', [courseId]);
    
    if (courseCheck.rows.length === 0) {
      throw new Error('Course not found in available institution courses');
    }
    
    // Check if the user profile exists
    const userCheck = await db.query('SELECT user_profile_id FROM users_profile WHERE user_profile_id = $1', [userProfileId]);
    
    if (userCheck.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Check if the user already has this course
    const existingRegistration = await db.query(
      'SELECT registration_id FROM student_courses WHERE user_profile_id = $1 AND course_id = $2',
      [userProfileId, courseId]
    );
    
    if (existingRegistration.rows.length > 0) {
      // User already registered for this course
      return { registered: false, message: 'Already registered for this course' };
    }
    
    // Add the course for the user
    const result = await db.query(
      'INSERT INTO student_courses (user_profile_id, course_id) VALUES ($1, $2) RETURNING registration_id',
      [userProfileId, courseId]
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
 * @param {number} userProfileId - The user profile ID
 * @param {number} courseId - The course ID
 * @returns {Promise<Object|null>} - Grade information or null if not found
 */
async function getGradeForUserCourse(userProfileId, courseId) {
  try {
    const result = await db.query(`
      SELECT g.grade_id, g.grade, g.grade_scale, g.submission_date,
             c.course_code, c.course_name, c.department, c.semester,
             CONCAT(up.first_name, ' ', up.last_name) as student_name, up.academic_id as academic_number
      FROM grades g
      JOIN courses c ON g.course_id = c.course_id
      JOIN users_profile up ON g.user_profile_id = up.user_profile_id
      WHERE g.user_profile_id = $1 AND g.course_id = $2
      ORDER BY g.submission_date DESC
      LIMIT 1
    `, [userProfileId, courseId]);
    
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
    // Start a transaction to ensure data consistency
    await db.query('BEGIN');
    
    try {
      // First, check if the student exists by academic_id
      let userResult = await db.query(`
        SELECT user_profile_id, user_service_id
        FROM users_profile
        WHERE academic_id = $1
      `, [gradeData.student_academic_number]);
      
      let userProfileId;
      
      if (userResult.rows.length === 0) {
        // User profile doesn't exist, create it
        // Use academic_id as a unique identifier for user_service_id for now
        const uniqueUserServiceId = `student_${gradeData.student_academic_number}_${Date.now()}`;
        
        userResult = await db.query(`
          INSERT INTO users_profile (
            user_service_id, academic_id, first_name, last_name, email, role, department
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) RETURNING user_profile_id`,
          [
            uniqueUserServiceId, // Unique identifier
            gradeData.student_academic_number,
            gradeData.student_name ? gradeData.student_name.split(' ')[0] : '',
            gradeData.student_name ? gradeData.student_name.split(' ').slice(1).join(' ') : '',
            `${gradeData.student_academic_number}@student.edu`, // Generate a temporary email
            'student',
            gradeData.department || ''
          ]
        );
        
        userProfileId = userResult.rows[0].user_profile_id;
        console.log(`Created new user profile with ID: ${userProfileId}`);
      } else {
        userProfileId = userResult.rows[0].user_profile_id;
        console.log(`Found existing user profile with ID: ${userProfileId}`);
      }
      
      // Ensure the course exists
      let courseResult = await db.query(
        'SELECT course_id FROM courses WHERE course_code = $1',
        [gradeData.course_code]
      );
      
      let courseId;
      
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
            gradeData.department || '', 
            gradeData.semester || ''
          ]
        );
      }
      
      courseId = courseResult.rows[0].course_id;
      console.log(`Using course ID: ${courseId}`);
      
      // Check if the user is registered for this course
      console.log(`Checking registration for user ${userProfileId} and course ${courseId}`);
      const registrationCheck = await db.query(
        'SELECT registration_id FROM student_courses WHERE user_profile_id = $1 AND course_id = $2',
        [userProfileId, courseId]
      );      if (registrationCheck.rows.length === 0) {
        // Automatically register the student for this course
        console.log(`Registering user ${userProfileId} for course ${courseId}`);
        await db.query(
          'INSERT INTO student_courses (user_profile_id, course_id) VALUES ($1, $2)',
          [userProfileId, courseId]
        );
        console.log(`Successfully registered user ${userProfileId} for course ${courseId}`);
      }
      
      // Check if this grade already exists
      const gradeCheck = await db.query(`
        SELECT grade_id FROM grades 
        WHERE user_profile_id = $1 AND course_id = $2 AND submission_id = $3`,
        [userProfileId, courseId, gradeData.submission_id]
      );
      
      let result;
      
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
        
        result = { 
          updated: true, 
          gradeId: gradeCheck.rows[0].grade_id 
        };
      } else {
        // Insert new grade
        const insertResult = await db.query(`
          INSERT INTO grades (
            user_profile_id, course_id, grade, grade_scale, submission_id, 
            submitted_by, submission_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) RETURNING grade_id`,
          [
            userProfileId,
            courseId,
            gradeData.grade,
            gradeData.grade_scale,
            gradeData.submission_id,
            null, // submitted_by might not be available
            new Date(gradeData.created_at || Date.now())
          ]
        );
        
        result = { 
          inserted: true, 
          gradeId: insertResult.rows[0].grade_id 
        };
      }
      
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
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
      SELECT course_id, course_code, course_name, department, semester, academic_year
      FROM institution_courses
      ORDER BY course_name
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all courses:', error);
    throw error;
  }
}

/**
 * Save a user received from the message queue
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} - Result of the operation
 */
async function saveUserFromQueue(userData) {
  try {
    // Start a transaction to ensure data consistency
    await db.query('BEGIN');
    
    try {
      // Check if user profile already exists - either by academic_id or by user_service_id
      let userProfileResult = await db.query(
        'SELECT user_profile_id FROM users_profile WHERE academic_id = $1 OR user_service_id = $2',
        [userData.academic_id, userData.user_service_id]
      );
      
      let userProfileId;
      
      if (userProfileResult.rows.length === 0) {
        // User profile doesn't exist, create it
        userProfileResult = await db.query(`
          INSERT INTO users_profile (
            user_service_id, academic_id, first_name, last_name, email, role, institution_id, department
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING user_profile_id`,
          [
            userData.user_service_id,
            userData.academic_id,
            userData.first_name,
            userData.last_name,
            userData.email || '',
            userData.role || 'student',
            userData.institution_id || null,
            userData.department || ''
          ]
        );
        
        userProfileId = userProfileResult.rows[0].user_profile_id;
        
        await db.query('COMMIT');
        
        return { 
          inserted: true, 
          userProfileId: userProfileId
        };
      } else {
        // User profile exists, update it
        userProfileId = userProfileResult.rows[0].user_profile_id;
        
        // Update profile
        await db.query(`
          UPDATE users_profile SET
            academic_id = COALESCE($1, academic_id),
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            role = COALESCE($4, role),
            institution_id = COALESCE($5, institution_id),
            department = COALESCE($6, department),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_profile_id = $7`,
          [
            userData.academic_id,
            userData.first_name,
            userData.last_name,
            userData.role,
            userData.institution_id,
            userData.department,
            userProfileId
          ]
        );
        
        await db.query('COMMIT');
        
        return { 
          updated: true, 
          userProfileId: userProfileId
        };
      }
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving user from queue:', error);
    throw error;
  }
}

async function getAvailableInstitutionCoursesByUser(userId) {
  try {
    // First get the institution_id of the user
    const userResult = await db.query(
      'SELECT institution_id FROM users_profile WHERE user_service_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const institutionId = userResult.rows[0].institution_id;

    // Now fetch all courses from institution_courses for that institution
    const result = await db.query(
      'SELECT course_id AS id, course_name AS name FROM institution_courses WHERE institution_id = $1 ORDER BY course_name',
      [institutionId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting institution courses:', error);
    throw error;
  }
}


module.exports = {
  getCoursesByUserId,
  addCourseForUser,
  getGradeForUserCourse,
  saveGradeFromQueue,
  getAllCourses,
  saveUserFromQueue,
  getAvailableInstitutionCoursesByUser
};
