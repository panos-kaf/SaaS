const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');

// Create a new request
router.post('/post-request/:courseID/:userID', requestsController.createRequest);

// Delete a request
router.delete('/delete-request/:requestID/:userID', requestsController.deleteRequest);

// View requests for a user
router.get('/view-requests/:userID', requestsController.getRequestsByUser);

// Close a request
router.post('/close-request/:requestID', requestsController.closeRequest);

module.exports = router;