const express = require('express');
const repliesController = require('../controllers/repliesController');
const router = express.Router();

// Create a new reply for a request
router.post('/create-reply/:requestID', repliesController.createReply);

// Delete a reply
router.delete('/delete-reply/:replyID', repliesController.deleteReply);

// Get all replies for a request
router.get('/view-replies/:requestID', repliesController.getRepliesForRequest);

module.exports = router;