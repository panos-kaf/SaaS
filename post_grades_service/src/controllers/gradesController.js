const db = require('../database/db');
const fs = require('fs'); // File system module for deleting files if necessary
const path = require('path'); // Path module for constructing file paths

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads'); // Adjust path as necessary
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. Post Grades
exports.postGrades = async (req, res) => {
    const { course_name, exam_period, date, professor } = req.body;
    const file = req.file;

    if (!course_name || !exam_period || !date || !professor || !file) {
        return res.status(400).json({ error: 'Missing required fields: course_name, exam_period, date, professor, and gradesFile are required.' });
    }

    // Basic validation for date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        if (file && file.path) {
            // Clean up uploaded file if validation fails
            fs.unlink(file.path, err => {
                if (err) console.error("Error deleting uploaded file after validation fail:", err);
            });
        }
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    const filePath = file.path;

    try {
        const result = await db.query(
            'INSERT INTO grades (course_name, exam_period, exam_date, professor, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING grades_id',
            [course_name, exam_period, date, professor, filePath]
        );
        res.status(201).json({ message: 'Grades posted successfully', grades_id: result.rows[0].grades_id });
    } catch (error) {
        console.error('Error posting grades:', error);
        // Clean up uploaded file if database insertion fails
        if (file && file.path) {
            fs.unlink(file.path, err => {
                if (err) console.error("Error deleting uploaded file after DB error:", err);
            });
        }
        res.status(500).json({ error: 'Failed to post grades.', details: error.message });
    }
};

// 2. Edit Grades
exports.editGrades = async (req, res) => {
    const { grades_ID } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Missing gradesFile for update.' });
    }

    const newFilePath = file.path;

    try {
        // First, retrieve the old file path to delete it after update
        const oldGradeEntry = await db.query('SELECT file_path FROM grades WHERE grades_id = $1', [grades_ID]);
        if (oldGradeEntry.rows.length === 0) {
            // Clean up the newly uploaded file if the record doesn't exist
            fs.unlink(newFilePath, err => {
                if (err) console.error("Error deleting new file for non-existent record:", err);
            });
            return res.status(404).json({ error: 'Grade entry not found.' });
        }
        const oldFilePath = oldGradeEntry.rows[0].file_path;

        // Update the database record with the new file path
        const result = await db.query(
            'UPDATE grades SET file_path = $1, updated_at = CURRENT_TIMESTAMP WHERE grades_id = $2 RETURNING grades_id',
            [newFilePath, grades_ID]
        );

        if (result.rowCount === 0) {
            // Should not happen if previous check passed, but as a safeguard
            fs.unlink(newFilePath, err => {
                if (err) console.error("Error deleting new file if update failed unexpectedly:", err);
            });
            return res.status(404).json({ error: 'Grade entry not found for update.' });
        }

        // If update was successful, delete the old file
        if (oldFilePath && oldFilePath !== newFilePath) {
            fs.unlink(oldFilePath, (err) => {
                if (err) {
                    console.error('Failed to delete old grades file:', err);
                    // Non-critical error, so don't send error response to client for this
                }
            });
        }

        res.status(200).json({ message: 'Grades updated successfully', grades_id: grades_ID });
    } catch (error) {
        console.error('Error editing grades:', error);
        // Clean up the newly uploaded file if there's an error during the process
        fs.unlink(newFilePath, err => {
            if (err) console.error("Error deleting new file after DB error during edit:", err);
        });
        res.status(500).json({ error: 'Failed to edit grades.', details: error.message });
    }
};

// 3. Delete Grades
exports.deleteGrades = async (req, res) => {
    const { grades_ID } = req.params;

    try {
        // First, retrieve the file path to delete the file from storage
        const gradeEntry = await db.query('SELECT file_path FROM grades WHERE grades_id = $1', [grades_ID]);
        if (gradeEntry.rows.length === 0) {
            return res.status(404).json({ error: 'Grade entry not found.' });
        }
        const filePathToDelete = gradeEntry.rows[0].file_path;

        // Delete the database record
        const result = await db.query('DELETE FROM grades WHERE grades_id = $1 RETURNING grades_id', [grades_ID]);

        if (result.rowCount === 0) {
            // Should not happen if previous check passed
            return res.status(404).json({ error: 'Grade entry not found for deletion, though it was just found.' });
        }

        // If deletion from DB was successful, delete the associated file
        if (filePathToDelete) {
            fs.unlink(filePathToDelete, (err) => {
                if (err) {
                    console.error('Failed to delete grades file from storage:', err);
                    // Log error, but the main record is deleted. Consider how to handle orphaned files.
                }
            });
        }

        res.status(200).json({ message: 'Grades deleted successfully', grades_id: grades_ID });
    } catch (error) {
        console.error('Error deleting grades:', error);
        res.status(500).json({ error: 'Failed to delete grades.', details: error.message });
    }
};