const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Added for CSV parsing
const gradesMessaging = require('../messaging/gradesMessaging'); // Added for messaging

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads'); // Adjust path as necessary
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to delete a file
const deleteFile = (filePath) => {
    if (filePath) {
        fs.unlink(filePath, err => {
            if (err) console.error(`Error deleting file ${filePath}:`, err);
        });
    }
};

// Helper function to parse CSV and insert grades into the database
const processGradesFile = (filePath, submissionId) => {
    return new Promise((resolve, reject) => {
        const gradesToInsert = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Basic validation: ensure all required fields from the schema are present in the CSV row
                // These names should match your CSV headers
                const { 
                    course_id, prof_id, student_academic_number, student_name, 
                    student_email, semester, course_name, course_code, 
                    grade_scale, grade 
                } = row;

                if (!course_id || !prof_id || !student_academic_number || !student_name || 
                    !semester || !course_name || !course_code || !grade_scale || !grade) {
                    // Skip row or collect error, here we'll skip and log
                    console.warn('Skipping row due to missing required fields:', row);
                    return;
                }

                gradesToInsert.push({
                    submission_id: submissionId,
                    course_id,
                    prof_id,
                    student_academic_number,
                    student_name,
                    student_email: student_email || null, // Handle optional email
                    semester,
                    course_name,
                    course_code,
                    grade_scale,
                    grade
                });
            })
            .on('end', async () => {
                if (gradesToInsert.length === 0) {
                    // If the file was empty or all rows were invalid
                    console.log(`No valid grade data found in file for submission ID: ${submissionId}`);
                    resolve(); // Resolve successfully as the file itself was processed
                    return;
                }
                try {
                    // Insert all grades in a single batch if possible, or loop if necessary
                    // For simplicity, looping here. For very large files, batching is better.
                    for (const gradeEntry of gradesToInsert) {
                        await db.query(
                            'INSERT INTO grades (submission_id, course_id, prof_id, student_academic_number, student_name, student_email, semester, course_name, course_code, grade_scale, grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                            [
                                gradeEntry.submission_id, gradeEntry.course_id, gradeEntry.prof_id, 
                                gradeEntry.student_academic_number, gradeEntry.student_name, gradeEntry.student_email,
                                gradeEntry.semester, gradeEntry.course_name, gradeEntry.course_code, 
                                gradeEntry.grade_scale, gradeEntry.grade
                            ]
                        );
                    }
                    resolve();
                } catch (dbError) {
                    console.error('Error inserting grades during CSV processing:', dbError);
                    reject(dbError); // This will trigger rollback in the calling function
                }
            })
            .on('error', (parseError) => {
                console.error('Error parsing CSV file:', parseError);
                reject(parseError); // This will trigger rollback
            });
    });
};


// 1. Upload Grades File and Create Submission
// This replaces the old postGrades. It now creates a submission record
// and then expects individual grades to be parsed from the file and inserted.
exports.uploadAndProcessGrades = async (req, res) => {
    const file = req.file;
    // Assuming owner_user_service_id comes from authenticated user session/token
    const owner_user_service_id = req.user?.user_service_id; 

    if (!file) {
        return res.status(400).json({ error: 'Grades file is required.' });
    }
    if (!owner_user_service_id) {
        deleteFile(file.path);
        return res.status(401).json({ error: 'User not authenticated or user_service_id missing.' });
    }

    const filePath = file.path;
    let submissionId;

    try {
        // Start a transaction
        await db.query('BEGIN');

        const submissionResult = await db.query(
            'INSERT INTO grade_submissions (owner_user_service_id, file_path) VALUES ($1, $2) RETURNING submission_id',
            [owner_user_service_id, filePath]
        );
        submissionId = submissionResult.rows[0].submission_id;

        // Process the CSV file and insert grades
        await processGradesFile(filePath, submissionId);

        await db.query('COMMIT');
        
        // Publish the grades to the message queue - This happens after transaction commit
        // We don't want to block the response, so we don't await this
        gradesMessaging.publishSubmissionGrades(submissionId)
            .then(success => {
                if (!success) {
                    console.warn(`Failed to publish grades for submission ${submissionId}`);
                }
            })
            .catch(err => {
                console.error(`Error publishing grades for submission ${submissionId}:`, err);
            });

        res.status(201).json({ 
            message: 'Grade submission and grades processed successfully.', 
            submission_id: submissionId
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error in uploadAndProcessGrades:', error);
        deleteFile(filePath); // Clean up uploaded file if submission fails
        res.status(500).json({ error: 'Failed to process grade submission.', details: error.message });
    }
};

// 2. Update Grade Submission File (replaces old editGrades)
// Allows replacing the file for a non-finalized submission.
exports.updateGradeSubmissionFile = async (req, res) => {
    const { submission_id } = req.params;
    const file = req.file;
    const user_service_id = req.user?.user_service_id;

    if (!file) {
        return res.status(400).json({ error: 'New grades file is required for update.' });
    }
    if (!user_service_id) {
        deleteFile(file.path);
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    const newFilePath = file.path;
    let oldFilePath;

    try {
        await db.query('BEGIN');

        const submissionCheck = await db.query(
            'SELECT file_path, owner_user_service_id, finalized FROM grade_submissions WHERE submission_id = $1',
            [submission_id]
        );

        if (submissionCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            deleteFile(newFilePath);
            return res.status(404).json({ error: 'Grade submission not found.' });
        }

        const submission = submissionCheck.rows[0];
        oldFilePath = submission.file_path;

        if (submission.owner_user_service_id !== user_service_id) {
            await db.query('ROLLBACK');
            deleteFile(newFilePath);
            return res.status(403).json({ error: 'Forbidden: You are not the owner of this submission.' });
        }

        if (submission.finalized) {
            await db.query('ROLLBACK');
            deleteFile(newFilePath);
            return res.status(403).json({ error: 'Forbidden: This grade submission is finalized and cannot be edited.' });
        }

        // Update the file path in the submission record
        await db.query(
            'UPDATE grade_submissions SET file_path = $1, updated_at = CURRENT_TIMESTAMP WHERE submission_id = $2',
            [newFilePath, submission_id]
        );

        // Delete existing grades associated with this submission_id
        await db.query('DELETE FROM grades WHERE submission_id = $1', [submission_id]);

        // Process the new CSV file and insert grades
        await processGradesFile(newFilePath, submission_id);

        await db.query('COMMIT');
        
        // Delete the old file after successful update and commit
        if (oldFilePath && oldFilePath !== newFilePath) {
            deleteFile(oldFilePath);
        }

        // Publish updated grades to the message queue
        gradesMessaging.publishSubmissionGrades(submission_id)
            .then(success => {
                if (!success) {
                    console.warn(`Failed to publish updated grades for submission ${submission_id}`);
                }
            })
            .catch(err => {
                console.error(`Error publishing updated grades for submission ${submission_id}:`, err);
            });

        res.status(200).json({ 
            message: 'Grade submission file updated and grades re-processed successfully.', 
            submission_id: submission_id
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error in updateGradeSubmissionFile:', error);
        deleteFile(newFilePath); // Clean up newly uploaded file on error
        // Don't delete oldFilePath here as rollback might have kept it
        res.status(500).json({ error: 'Failed to update grade submission file.', details: error.message });
    }
};

// 3. Delete Grade Submission (replaces old deleteGrades)
exports.deleteGradeSubmission = async (req, res) => {
    const { submission_id } = req.params;
    const user_service_id = req.user?.user_service_id;
    const user_role = req.user?.role; // Assuming role is available for admin override

    if (!user_service_id) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
        await db.query('BEGIN');

        const submissionCheck = await db.query(
            'SELECT file_path, owner_user_service_id, finalized FROM grade_submissions WHERE submission_id = $1',
            [submission_id]
        );

        if (submissionCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Grade submission not found.' });
        }

        const submission = submissionCheck.rows[0];
        const filePathToDelete = submission.file_path;

        // Ownership check or admin override
        if (submission.owner_user_service_id !== user_service_id && user_role !== 'admin') { // Example admin role
            await db.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden: You are not the owner or an admin.' });
        }

        // Check if finalized (policy might differ, e.g., admin can delete finalized)
        if (submission.finalized && user_role !== 'admin') {
            await db.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden: This submission is finalized. Contact an admin for deletion.' });
        }

        // Deleting from grade_submissions will cascade delete from grades table
        const deleteResult = await db.query('DELETE FROM grade_submissions WHERE submission_id = $1 RETURNING submission_id', [submission_id]);

        if (deleteResult.rowCount === 0) {
            // Should not happen if previous check passed
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Grade submission not found for deletion, though it was just found.' });
        }
        
        await db.query('COMMIT');

        // If deletion from DB was successful, delete the associated file
        deleteFile(filePathToDelete);

        res.status(200).json({ message: 'Grade submission and associated grades deleted successfully', submission_id: submission_id });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error deleting grade submission:', error);
        res.status(500).json({ error: 'Failed to delete grade submission.', details: error.message });
    }
};

// 4. Finalize Grade Submission
exports.finalizeGradeSubmission = async (req, res) => {
    const { submission_id } = req.params; // Changed from grades_ID to submission_id
    const user_service_id = req.user?.user_service_id;

    if (!user_service_id) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
        const submissionCheck = await db.query(
            'SELECT owner_user_service_id, finalized FROM grade_submissions WHERE submission_id = $1',
            [submission_id]
        );

        if (submissionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Grade submission not found.' });
        }

        const submission = submissionCheck.rows[0];

        if (submission.owner_user_service_id !== user_service_id) {
            return res.status(403).json({ error: 'Forbidden: You are not the owner of this submission.' });
        }

        if (submission.finalized) {
            return res.status(400).json({ message: 'Grade submission is already finalized.' });
        }

        // Check if there are any grades associated with this submission
        const gradesCountResult = await db.query(
            'SELECT COUNT(*) FROM grades WHERE submission_id = $1',
            [submission_id]
        );
        
        const gradesCount = parseInt(gradesCountResult.rows[0].count, 10);
        if (gradesCount === 0) {
            return res.status(400).json({ 
                error: 'Cannot finalize submission with no grades. Please ensure grades have been processed.' 
            });
        }

        await db.query(
            'UPDATE grade_submissions SET finalized = TRUE, updated_at = CURRENT_TIMESTAMP WHERE submission_id = $1',
            [submission_id]
        );

        // Publish the finalization event and all grades
        // Run these asynchronously without blocking the response
        Promise.all([
            gradesMessaging.publishFinalization(submission_id),
            gradesMessaging.publishSubmissionGrades(submission_id)
        ])
        .then(([finalizationSuccess, gradesSuccess]) => {
            if (!finalizationSuccess || !gradesSuccess) {
                console.warn(`Some messaging operations failed for finalized submission ${submission_id}`);
            }
        })
        .catch(err => {
            console.error(`Error in messaging operations for finalized submission ${submission_id}:`, err);
        });

        res.status(200).json({ message: 'Grade submission finalized successfully. No further edits allowed.', submission_id: submission_id });
    } catch (error) {
        console.error('Error finalizing grade submission:', error);
        res.status(500).json({ error: 'Failed to finalize grade submission.', details: error.message });
    }
};