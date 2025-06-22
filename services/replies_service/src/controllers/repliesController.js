const db = require('../database/db');
const { publisher } = require('../messaging/setup');

/**
 * Create a new reply for a request
 */
const createReply = async (req, res) => {
  const { requestID } = req.params;
  const { reply_body } = req.body;
  const user_id = req.user.id; // Get user_id from JWT token via auth middleware

  // console.log(' createReply called');
  // console.log('req.user:', req.user); 

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'User not attached via x-user' });
  }

  try {
    // Verify that the request exists
    const requestCheck = await db.query(
      'SELECT * FROM requests WHERE request_id = $1',
      [requestID]
    );
    
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    // Verify that the user exists (this should always pass due to JWT auth)
    const userCheck = await db.query(
      'SELECT * FROM users_profile WHERE user_service_id = $1',
      [user_id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in local database' 
      });
    }
    
    // Create the reply
    const reply = await db.query(
      `INSERT INTO replies (request_id, user_id, reply_body)
       VALUES ($1, $2, $3) RETURNING *`,
      [requestID, user_id, reply_body]
    );
    
    // Publish the reply created event
    await publisher.publishReplyCreated(reply.rows[0]);
    
    return res.status(201).json({
      success: true,
      data: reply.rows[0],
      message: 'Reply created successfully'
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating reply'
    });
  }
};

/**
 * Delete a reply
 * Only the owner of the reply can delete it (enforced by middleware)
 */
const deleteReply = async (req, res) => {
  const { replyID } = req.params;
  
  try {
    // Get the reply
    const replyCheck = await db.query(
      'SELECT * FROM replies WHERE reply_id = $1',
      [replyID]
    );
    
    if (replyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }
    
    // Authorization check is now handled by middleware
    // so we can directly delete the reply
    
    // Delete the reply
    await db.query(
      'DELETE FROM replies WHERE reply_id = $1',
      [replyID]
    );
    
    // Publish the reply deleted event
    await publisher.publishReplyDeleted({ reply_id: replyID });
    
    return res.status(200).json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting reply'
    });
  }
};

/**
 * Get all replies for a specific request
 */
const getRepliesForRequest = async (req, res) => {
  const { requestID } = req.params;
  
  try {
    // Check if the request exists
    const requestCheck = await db.query(
      'SELECT * FROM requests WHERE request_id = $1',
      [requestID]
    );
    
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Get all replies for the request
    const repliesQuery = await db.query(
      `SELECT r.*, u.full_name, u.role, u.academic_id
       FROM replies r
       JOIN users_profile u ON r.user_id = u.user_service_id
       WHERE r.request_id = $1
       ORDER BY r.timestamp ASC`,
      [requestID]
    );
    
    return res.status(200).json({
      success: true,
      data: repliesQuery.rows,
      message: 'Replies retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching replies'
    });
  }
};

module.exports = {
  createReply,
  deleteReply,
  getRepliesForRequest
};