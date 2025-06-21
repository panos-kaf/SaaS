const express = require('express');
const repliesController = require('../controllers/repliesController');
const { authenticateJWT, authorizeRoles, verifyResourceOwnership } = require('../middleware/auth');
const router = express.Router();

// Get reply owner ID for ownership verification
const getReplyOwnerId = async (req) => {
  // If creating a new reply, the owner is the current user
  if (req.method === 'POST') {
    return req.user.id;
  }
  
  // For existing replies, fetch the reply and check the owner
  const db = require('../database/db');
  const replyId = req.params.replyID;
  
  const result = await db.query(
    'SELECT user_id FROM replies WHERE reply_id = $1',
    [replyId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Reply not found');
  }
  
  return result.rows[0].user_id;
};

// Create a new reply for a request
// Any authenticated user can create a reply
router.post(
  '/create-reply/:requestID',
  authenticateJWT,
  repliesController.createReply
);

// Delete a reply
// Only the owner of the reply or admin can delete it
router.delete(
  '/delete-reply/:replyID',
  authenticateJWT,
  verifyResourceOwnership(getReplyOwnerId),
  repliesController.deleteReply
);

// Get all replies for a request
// Anyone who can view the request can view the replies
router.get(
  '/view-replies/:requestID',
  authenticateJWT,
  repliesController.getRepliesForRequest
);

module.exports = router;