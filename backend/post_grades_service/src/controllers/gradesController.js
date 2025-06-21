const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Added for CSV parsing
const gradesMessaging = require('../messaging/gradesMessaging'); // Added for messaging
const XLSX = require('xlsx'); // Για υποστήριξη xlsx

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
        const invalidRows = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Basic validation: ensure all required fields from the schema are present in the CSV row
                // These names should match your CSV headers
                const { 
                    prof_id, student_academic_number, student_name, 
                    student_email, semester, course_name, course_code, 
                    grade_scale, grade, academic_year
                } = row;

                if (!prof_id || !student_academic_number || !student_name || 
                    !semester || !course_name || !course_code || !grade_scale || !grade || !academic_year) {
                    // Skip row or collect error, here we'll skip and log
                    console.warn('Skipping row due to missing required fields:', row);
                    invalidRows.push({ row, error: 'Missing required fields' });
                    return;
                }

                gradesToInsert.push({
                    submission_id: submissionId,
                    prof_id,
                    student_academic_number,
                    student_name,
                    student_email: student_email || null, // Handle optional email
                    semester,
                    course_name,
                    course_code,
                    grade_scale,
                    grade,
                    academic_year
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
                    // Validate all courses and look up course_ids before inserting grades
                    const validatedGrades = [];
                    for (const gradeEntry of gradesToInsert) {
                        // Look up course_id by course_code and academic_year combination
                        const courseResult = await db.query(
                            'SELECT course_id FROM institution_courses WHERE course_code = $1 AND academic_year = $2',
                            [gradeEntry.course_code, gradeEntry.academic_year]
                        );
                        
                        if (courseResult.rows.length === 0) {
                            console.warn(`Course with code ${gradeEntry.course_code} and academic year ${gradeEntry.academic_year} not found in institution courses, skipping grade for student ${gradeEntry.student_academic_number}`);
                            invalidRows.push({ 
                                row: gradeEntry, 
                                error: `Course with code ${gradeEntry.course_code} and academic year ${gradeEntry.academic_year} not found in institution courses` 
                            });
                            continue;
                        }
                        
                        // Add the course_id to the grade entry
                        gradeEntry.course_id = courseResult.rows[0].course_id;
                        validatedGrades.push(gradeEntry);
                    }
                    
                    if (validatedGrades.length === 0) {
                        console.warn(`No valid courses found for submission ID: ${submissionId}`);
                        resolve();
                        return;
                    }
                    
                    // Insert validated grades
                    for (const gradeEntry of validatedGrades) {
                        await db.query(
                            'INSERT INTO grades (submission_id, course_id, prof_id, student_academic_number, student_name, student_email, semester, academic_year, course_name, course_code, grade_scale, grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                            [
                                gradeEntry.submission_id, gradeEntry.course_id, gradeEntry.prof_id, 
                                gradeEntry.student_academic_number, gradeEntry.student_name, gradeEntry.student_email,
                                gradeEntry.semester, gradeEntry.academic_year, gradeEntry.course_name, gradeEntry.course_code, 
                                gradeEntry.grade_scale, gradeEntry.grade
                            ]
                        );
                    }
                    
                    if (invalidRows.length > 0) {
                        console.warn(`Processed ${validatedGrades.length} valid grades, skipped ${invalidRows.length} invalid entries for submission ${submissionId}`);
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

// ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Επεξεργασία αρχείου xlsx και εισαγωγή βαθμών
const processGradesXLSX = (filePath, submissionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rowsRaw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            // Βρες το index της γραμμής που ξεκινάει με "Αριθμός Μητρώου"
            const headerIndex = rowsRaw.findIndex(
                row => row[0] && row[0].toString().trim() === 'Αριθμός Μητρώου'
            );
            if (headerIndex === -1) throw new Error('Δεν βρέθηκαν headers!');
            const headers = rowsRaw[headerIndex];
            const dataRows = rowsRaw.slice(headerIndex + 1);
            // Μετατροπή σε objects, αγνοώντας κενές γραμμές
            const rows = dataRows
                .filter(row => row[0])
                .map(row => {
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h.trim()] = row[i];
                    });
                    return obj;
                });
            // Φιλτράρισμα: αγνόησε κενές γραμμές ή γραμμές χωρίς "Αριθμός Μητρώου"
            const potentialGrades = rows.filter(row => row['Αριθμός Μητρώου'] && row['Ονοματεπώνυμο']).map(row => {
                // Εξαγωγή course_name και course_code από το πεδίο "Τμήμα Τάξης"
                const tmima = row['Τμήμα Τάξης'] || '';
                const match = tmima.match(/^(.*)\s*\((\d+)\)/);
                let course_name = tmima;
                let course_code = '';
                if (match) {
                    course_name = match[1].trim();
                    course_code = match[2];
                }
                return {
                    submission_id: submissionId,
                    student_academic_number: row['Αριθμός Μητρώου'],
                    student_name: row['Ονοματεπώνυμο'],
                    student_email: row['Ακαδημαϊκό E-mail'],
                    semester: row['Περίοδος δήλωσης'],
                    academic_year: row['Ακαδημαϊκό Έτος'] || row['Academic Year'] || '2024-2025', // fallback if not present
                    course_name,
                    course_code,
                    grade_scale: row['Κλίμακα βαθμολόγησης'],
                    grade: row['Βαθμολογία']
                };
            });
            
            // Validate grades and resolve course_id from course_code
            const validatedGrades = [];
            const invalidRows = [];
            
            for (const gradeEntry of potentialGrades) {
                if (!gradeEntry.course_code) {
                    console.warn(`Missing course code for student ${gradeEntry.student_academic_number}, skipping`);
                    invalidRows.push({ row: gradeEntry, error: 'Missing course code' });
                    continue;
                }
                
                if (!gradeEntry.academic_year) {
                    console.warn(`Missing academic year for student ${gradeEntry.student_academic_number}, skipping`);
                    invalidRows.push({ row: gradeEntry, error: 'Missing academic year' });
                    continue;
                }
                
                // Look up course_id by course_code and academic_year combination
                try {
                    const courseResult = await db.query(
                        'SELECT course_id FROM institution_courses WHERE course_code = $1 AND academic_year = $2',
                        [gradeEntry.course_code, gradeEntry.academic_year]
                    );
                    
                    if (courseResult.rows.length === 0) {
                        console.warn(`Course with code ${gradeEntry.course_code} and academic year ${gradeEntry.academic_year} not found in institution courses, skipping grade for student ${gradeEntry.student_academic_number}`);
                        invalidRows.push({ 
                            row: gradeEntry, 
                            error: `Course with code ${gradeEntry.course_code} and academic year ${gradeEntry.academic_year} not found in institution courses` 
                        });
                        continue;
                    }
                    
                    // Add course_id to the grade entry
                    gradeEntry.course_id = courseResult.rows[0].course_id;
                    validatedGrades.push(gradeEntry);
                } catch (error) {
                    console.error(`Error validating course ${gradeEntry.course_code}:`, error);
                    invalidRows.push({ 
                        row: gradeEntry, 
                        error: `Error validating course ${gradeEntry.course_code}` 
                    });
                }
            }
            
            if (invalidRows.length > 0) {
                console.warn(`XLSX processing: ${validatedGrades.length} valid grades, ${invalidRows.length} invalid entries`);
            }
            
            resolve(validatedGrades);
        } catch (err) {
            reject(err);
        }
    });
};


// 1. Upload Grades File and Create Submission
// This replaces the old postGrades. It now creates a submission record
// and then expects individual grades to be parsed from the file and inserted.
exports.uploadAndProcessGrades = async (req, res) => {
    const file = req.file;
    // Default prof_id για testing χωρίς authentication
    let owner_user_service_id;
    if (req.user && req.user.id) {
        owner_user_service_id = req.user.id;
    } else {
        owner_user_service_id = 'default_id'; // Βάλε εδώ το user_service_id που θες για testing
    }

    if (!file) {
        return res.status(400).json({ error: 'Grades file is required.' });
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

        let gradesToInsert = [];
        if (file.originalname.endsWith('.xlsx')) {
            gradesToInsert = await processGradesXLSX(filePath, submissionId);
        } else {
            await processGradesFile(filePath, submissionId); // csv
        }

        // Αν είναι xlsx, κάνε insert τα grades
        if (gradesToInsert.length > 0) {
            for (const gradeEntry of gradesToInsert) {
                await db.query(
                    'INSERT INTO grades (course_id, prof_id, submission_id, student_academic_number, student_name, student_email, semester, academic_year, course_name, course_code, grade_scale, grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                    [
                        gradeEntry.course_id, // course_id from validated course lookup
                        owner_user_service_id, // prof_id από τον χρήστη που κάνει το POST
                        gradeEntry.submission_id,
                        gradeEntry.student_academic_number,
                        gradeEntry.student_name,
                        gradeEntry.student_email,
                        gradeEntry.semester,
                        gradeEntry.academic_year,
                        gradeEntry.course_name,
                        gradeEntry.course_code,
                        gradeEntry.grade_scale,
                        gradeEntry.grade
                    ]
                );
            }
        }

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

// 2. Update Grade Submission File
// Allows replacing the file for a non-finalized submission.
exports.updateGradeSubmissionFile = async (req, res) => {
    const { submission_id } = req.params;
    const file = req.file;
    // Default user_service_id για testing χωρίς authentication
    let user_service_id;
    if (req.user && req.user.id) {
        user_service_id = req.user.id;
    } else {
        user_service_id = 'default_id'; // ή ό,τι id έχεις βάλει για testing
    }

    if (!file) {
        return res.status(400).json({ error: 'New grades file is required for update.' });
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

        // Process the new file and insert grades (xlsx/csv)
        let gradesToInsert = [];
        if (file.originalname.endsWith('.xlsx')) {
            gradesToInsert = await processGradesXLSX(newFilePath, submission_id);
        } else {
            await processGradesFile(newFilePath, submission_id); // csv
        }
        if (gradesToInsert.length > 0) {
            for (const gradeEntry of gradesToInsert) {
                await db.query(
                    'INSERT INTO grades (course_id, prof_id, submission_id, student_academic_number, student_name, student_email, semester, academic_year, course_name, course_code, grade_scale, grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                    [
                        gradeEntry.course_id, // course_id from validated course lookup
                        user_service_id, // prof_id
                        gradeEntry.submission_id,
                        gradeEntry.student_academic_number,
                        gradeEntry.student_name,
                        gradeEntry.student_email,
                        gradeEntry.semester,
                        gradeEntry.academic_year,
                        gradeEntry.course_name,
                        gradeEntry.course_code,
                        gradeEntry.grade_scale,
                        gradeEntry.grade
                    ]
                );
            }
        }

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
    // Default user_service_id και user_role για testing χωρίς authentication
    let user_service_id, user_role;
    if (req.user && req.user.id) {
        user_service_id = req.user.id;
        user_role = req.user.role;
    } else {
        user_service_id = 'default_id';
        user_role = 'admin'; // ή 'professor' αν θες να τεστάρεις ως καθηγητής
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
        if (submission.owner_user_service_id !== user_service_id && user_role !== 'admin') {
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
    const { submission_id } = req.params;
    // Default user_service_id για testing χωρίς authentication
    let user_service_id;
    if (req.user && req.user.id) {
        user_service_id = req.user.id;
    } else {
        user_service_id = 'default_id'; // ή ό,τι id έχεις βάλει για testing
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