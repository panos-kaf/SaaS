const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const messagingSetup = require('../messaging/setup');
const coursesService = require('../services/coursesService');

/**
 * Controller for handling institution-related operations
 */
class InstitutionController {
  
  /**
   * Enroll a new institution
   * POST /add-inst/
   */
  async enrollInstitution(req, res) {
    try {
      const {
        institution_name,
        institution_email,
        institution_address,
        contact_person,
        contact_email,
        contact_phone
      } = req.body;

      // Validate required fields
      if (!institution_name || !institution_email || !contact_person || !contact_email) {
        return res.status(400).json({
          success: false,
          message: 'Institution name, email, contact person, and contact email are required'
        });
      }

      // Get manager user ID from authenticated user
      const manager_user_id = req.user.id;

      // Check if institution already exists
      const existingInstitution = await db.query(
        'SELECT institution_id FROM institutions WHERE institution_email = $1 OR institution_name = $2',
        [institution_email, institution_name]
      );

      if (existingInstitution.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Institution with this name or email already exists'
        });
      }

      // Insert new institution
      const result = await db.query(
        `INSERT INTO institutions (
          institution_name, institution_email, institution_address,
          contact_person, contact_email, contact_phone, manager_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING institution_id`,
        [
          institution_name,
          institution_email,
          institution_address,
          contact_person,
          contact_email,
          contact_phone,
          manager_user_id
        ]
      );

      const institution_id = result.rows[0].institution_id;

      // Initialize credits for the institution (starting with 0 credits)
      await db.query(
        `INSERT INTO institution_credits (institution_id, total_credits, used_credits, available_credits)
         VALUES ($1, 0, 0, 0)`,
        [institution_id]
      );

      // Publish institution enrollment event
      try {
        await messagingSetup.publisher.publishInstitutionEvent({
          event_type: 'institution_enrolled',
          institution_id,
          institution_name,
          manager_user_id,
          timestamp: new Date()
        });
      } catch (messageError) {
        console.error('Failed to publish institution enrollment event:', messageError);
        // Continue with success response even if messaging fails
      }

      res.status(201).json({
        success: true,
        message: 'Institution enrolled successfully',
        institution_id,
        data: {
          institution_id,
          institution_name,
          institution_email,
          contact_person,
          contact_email,
          status: 'active'
        }
      });

    } catch (error) {
      console.error('Error enrolling institution:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while enrolling the institution',
        error: error.message
      });
    }
  }

  /**
   * Add credits to an institution
   * POST /add-creds/:institution_ID
   */
  async addCredits(req, res) {
    try {
      const { institution_ID } = req.params;
      const { amount, description } = req.body;

      // Validate required fields
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      // Check if institution exists
      const institutionResult = await db.query(
        'SELECT institution_id, institution_name FROM institutions WHERE institution_id = $1',
        [institution_ID]
      );

      if (institutionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      // Generate purchase ID
      const purchase_id = uuidv4();

      // Begin transaction
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Record the credit transaction
        await client.query(
          `INSERT INTO credit_transactions (
            institution_id, amount, transaction_type, purchase_id, description
          ) VALUES ($1, $2, 'purchase', $3, $4)`,
          [institution_ID, amount, purchase_id, description || 'Credit purchase']
        );

        // Update institution credits
        const updateResult = await client.query(
          `UPDATE institution_credits 
           SET total_credits = total_credits + $1,
               available_credits = total_credits - used_credits
           WHERE institution_id = $2
           RETURNING total_credits, used_credits, available_credits`,
          [amount, institution_ID]
        );

        await client.query('COMMIT');

        const credits = updateResult.rows[0];

        // Publish credit purchase event
        try {
          await messagingSetup.publisher.publishInstitutionEvent({
            event_type: 'credits_purchased',
            institution_id: institution_ID,
            amount,
            purchase_id,
            total_credits: credits.total_credits,
            available_credits: credits.available_credits,
            timestamp: new Date()
          });
        } catch (messageError) {
          console.error('Failed to publish credit purchase event:', messageError);
          // Continue with success response even if messaging fails
        }

        res.status(200).json({
          success: true,
          message: 'Credits added successfully',
          data: {
            purchase_id,
            amount_added: amount,
            total_credits: credits.total_credits,
            available_credits: credits.available_credits,
            used_credits: credits.used_credits,
            institution_name: institutionResult.rows[0].institution_name
          }
        });

      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error adding credits:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while adding credits',
        error: error.message
      });
    }
  }

  /**
   * View credits for an institution
   * GET /view-creds/:institution_ID
   */
  async viewCredits(req, res) {
    try {
      const { institution_ID } = req.params;

      // Get institution and credits information
      const result = await db.query(
        `SELECT 
          i.institution_id,
          i.institution_name,
          i.status,
          ic.total_credits,
          ic.used_credits,
          ic.available_credits,
          ic.last_updated
         FROM institutions i
         JOIN institution_credits ic ON i.institution_id = ic.institution_id
         WHERE i.institution_id = $1`,
        [institution_ID]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      const institutionData = result.rows[0];

      // Get recent credit transactions
      const transactionsResult = await db.query(
        `SELECT 
          transaction_id,
          amount,
          transaction_type,
          purchase_id,
          timestamp,
          description
         FROM credit_transactions
         WHERE institution_id = $1
         ORDER BY timestamp DESC
         LIMIT 10`,
        [institution_ID]
      );

      res.status(200).json({
        success: true,
        data: {
          institution_id: institutionData.institution_id,
          institution_name: institutionData.institution_name,
          status: institutionData.status,
          credits: {
            total_credits: institutionData.total_credits,
            used_credits: institutionData.used_credits,
            available_credits: institutionData.available_credits,
            last_updated: institutionData.last_updated
          },
          recent_transactions: transactionsResult.rows
        }
      });

    } catch (error) {
      console.error('Error viewing credits:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving credits information',
        error: error.message
      });
    }
  }

  /**
   * Register courses for an institution
   * POST /register_courses/:institution_ID
   */
  async registerCourses(req, res) {
    try {
      const { institution_ID } = req.params;
      const courses = req.body.courses;

      // Validate required fields
      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Courses array is required and must not be empty'
        });
      }

      // Check if institution exists
      const institutionResult = await db.query(
        'SELECT institution_id, institution_name FROM institutions WHERE institution_id = $1',
        [institution_ID]
      );

      if (institutionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      const client = await db.pool.connect();
      const successfulCourses = [];
      const failedCourses = [];

      try {
        await client.query('BEGIN');

        for (const course of courses) {
          const {
            course_code,
            course_name,
            department,
            semester,
            academic_year,
            professor_id
          } = course;

          // Validate required course fields
          if (!course_code || !course_name || !academic_year || !semester) {
            failedCourses.push({
              course,
              error: 'Missing required fields: course_code, course_name, academic_year, semester'
            });
            continue;
          }

          try {
            // Insert course
            const courseResult = await client.query(
              `INSERT INTO institution_courses (
                institution_id, course_code, course_name, department,
                semester, academic_year, professor_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *`,
              [
                institution_ID,
                course_code,
                course_name,
                department,
                semester,
                academic_year,
                professor_id
              ]
            );

            const createdCourse = courseResult.rows[0];
            
            // Add to successful courses array
            successfulCourses.push({
              course_id: createdCourse.course_id,
              course_code,
              course_name,
              department,
              semester,
              academic_year
            });

            // Publish course created event
            try {
              await coursesService.publishCourseEvent('COURSE_CREATED', createdCourse);
            } catch (publishError) {
              console.error('Failed to publish course created event:', publishError);
              // Continue processing even if event publishing fails
            }

          } catch (courseError) {
            failedCourses.push({
              course,
              error: courseError.message
            });
          }
        }

        await client.query('COMMIT');

        // Publish course registration event
        try {
          await messagingSetup.publisher.publishInstitutionEvent({
            event_type: 'courses_registered',
            institution_id: institution_ID,
            successful_courses: successfulCourses.length,
            failed_courses: failedCourses.length,
            timestamp: new Date()
          });
        } catch (messageError) {
          console.error('Failed to publish course registration event:', messageError);
          // Continue with success response even if messaging fails
        }

        res.status(200).json({
          success: true,
          message: 'Course registration completed',
          data: {
            institution_id: institution_ID,
            institution_name: institutionResult.rows[0].institution_name,
            successful_registrations: successfulCourses.length,
            failed_registrations: failedCourses.length,
            successful_courses: successfulCourses,
            failed_courses: failedCourses
          }
        });

      } catch (transactionError) {
        await client.query('ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error registering courses:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while registering courses',
        error: error.message
      });
    }
  }

  /**
   * Sync existing courses by publishing course events for all courses
   * POST /sync_courses/:institution_ID
   */
  async syncCourses(req, res) {
    try {
      const { institution_ID } = req.params;

      // Validate institution exists
      const institutionResult = await db.query(
        'SELECT institution_id, institution_name FROM institutions WHERE institution_id = $1',
        [institution_ID]
      );

      if (institutionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Institution not found'
        });
      }

      // Get all courses for the institution
      const coursesResult = await db.query(
        'SELECT * FROM institution_courses WHERE institution_id = $1',
        [institution_ID]
      );

      if (coursesResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No courses found to sync',
          synced_courses: 0
        });
      }

      // Publish course events for all existing courses
      let syncedCount = 0;
      let failedCount = 0;

      for (const course of coursesResult.rows) {
        try {
          await coursesService.publishCourseEvent('COURSE_CREATED', course);
          syncedCount++;
        } catch (publishError) {
          console.error(`Failed to publish sync event for course ${course.course_id}:`, publishError);
          failedCount++;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Course synchronization completed',
        data: {
          institution_id: institution_ID,
          institution_name: institutionResult.rows[0].institution_name,
          total_courses: coursesResult.rows.length,
          synced_courses: syncedCount,
          failed_courses: failedCount
        }
      });

    } catch (error) {
      console.error('Error syncing courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync courses',
        error: error.message
      });
    }
  }

}

module.exports = new InstitutionController();
