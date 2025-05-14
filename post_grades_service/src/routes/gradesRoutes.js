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

// POST /api/post-grades
router.post('/post-grades', upload.single('gradesFile'), gradesController.postGrades);

// PUT /api/edit-grades/:grades_ID (Changed from UPDATE to PUT for RESTful convention)
router.put('/edit-grades/:grades_ID', upload.single('gradesFile'), gradesController.editGrades);

// DELETE /api/delete-grades/:grades_ID
router.delete('/delete-grades/:grades_ID', gradesController.deleteGrades);

module.exports = router;