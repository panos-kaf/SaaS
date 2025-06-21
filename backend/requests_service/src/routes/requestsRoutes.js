const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');
const { authenticateJWT, authorizeRoles, verifyResourceOwnership } = require('../middleware/auth');

// Function to get request owner ID for ownership verification
const getRequestOwnerId = async (req) => {
  const db = require('../database/db');
  const requestId = req.params.requestID;
  
  // For a new request, the owner is the current user
  if (req.method === 'POST' && !requestId) {
    return req.user.id;
  }
  
  // For existing requests, fetch the request and check the owner
  const result = await db.query(
    'SELECT owner_id FROM requests WHERE request_id = $1',
    [requestId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Request not found');
  }
  
  return result.rows[0].owner_id;
};

// Create a new request
router.post(
  '/post-request/:courseID',
  // authenticateJWT, // <--- commented out for testing
  requestsController.createRequest
);

// Delete a request
router.delete(
  '/delete-request/:requestID',
  // authenticateJWT, // <--- commented out for testing
  // verifyResourceOwnership(getRequestOwnerId), // <--- commented out for testing
  requestsController.deleteRequest
);

// View requests for a user
router.get(
  '/view-requests',
  authenticateJWT, // <--- commented out for testing
  requestsController.getRequestsByUser
);

// Close a request
router.post(
  '/close-request/:requestID',
  // authenticateJWT, // <--- commented out for testing
  // verifyResourceOwnership(getRequestOwnerId), // <--- commented out for testing
  requestsController.closeRequest
);

module.exports = router;