const express = require('express');
const multer = require('multer');
const gradesController = require('../controllers/gradesController');

const router = express.Router();

// Configure multer for file uploads
// SET THE DESTINATION FOR FILE UPLOADS
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure 'uploads/' directory exists or is created
    },
    filename: function (req, file, cb) {
        // cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        // Keep original filename for simplicity, consider more robust naming in production
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Example: 10MB file size limit
    fileFilter: function (req, file, cb) {
        // Add any specific file filtering logic here (e.g., only CSV files)
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only .csv files are allowed!'), false);
        }
    }
});

// POST /api/grade-submissions - Uploads a grades file and creates a submission record
router.post('/grade-submissions', upload.single('gradesFile'), gradesController.uploadAndProcessGrades);

// PUT /api/grade-submissions/:submission_id/file - Updates the file for a specific grade submission
router.put('/grade-submissions/:submission_id/file', upload.single('gradesFile'), gradesController.updateGradeSubmissionFile);

// DELETE /api/grade-submissions/:submission_id - Deletes a grade submission and its associated grades
router.delete('/grade-submissions/:submission_id', gradesController.deleteGradeSubmission);

// POST /api/grade-submissions/:submission_id/finalize - Finalizes a grade submission
router.post('/grade-submissions/:submission_id/finalize', gradesController.finalizeGradeSubmission);

module.exports = router;