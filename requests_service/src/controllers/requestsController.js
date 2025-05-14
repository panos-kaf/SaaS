const db = require('../database/db');

// Creates a new review request
const createRequest = async (req, res) => {
  const { courseID, userID } = req.params;
  const { requestBody, profID, gradeID } = req.body;

  try {
    if (!requestBody) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const result = await db.query(
      'INSERT INTO requests (owner_id, grade_id, prof_id, request_body, status) VALUES ($1, $2, $3, $4, $5) RETURNING request_id',
      [userID, gradeID, profID, requestBody, 'open']
    );

    return res.status(201).json({ requestID: result.rows[0].request_id });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
};

// Deletes a review request
const deleteRequest = async (req, res) => {
  const { requestID } = req.params;
  const { userID } = req.body; // Assume userID is provided to check ownership

  try {
    // Verify request ownership
    const requestCheck = await db.query(
      'SELECT owner_id FROM requests WHERE request_id = $1',
      [requestID]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requestCheck.rows[0].owner_id != userID) {
      return res.status(403).json({ error: 'You do not have permission to delete this request' });
    }

    await db.query(
      'DELETE FROM requests WHERE request_id = $1',
      [requestID]
    );

    return res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
};

// Retrieve all requests for a specific user (student or professor)
const getRequestsByUser = async (req, res) => {
  const { userID } = req.params;
  const { role } = req.query; // 'student' or 'professor'

  try {
    let result;

    if (role === 'professor') {
      result = await db.query(
        'SELECT * FROM requests WHERE prof_id = $1 ORDER BY timestamp DESC',
        [userID]
      );
    } else {
      // Default to student role
      result = await db.query(
        'SELECT * FROM requests WHERE owner_id = $1 ORDER BY timestamp DESC',
        [userID]
      );
    }

    return res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error('Error retrieving requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve requests' });
  }
};

// Close a request
const closeRequest = async (req, res) => {
  const { requestID } = req.params;
  const { userID } = req.body; // Assume userID is provided to check ownership

  try {
    // Verify request ownership
    const requestCheck = await db.query(
      'SELECT owner_id, status FROM requests WHERE request_id = $1',
      [requestID]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requestCheck.rows[0].owner_id != userID) {
      return res.status(403).json({ error: 'You do not have permission to close this request' });
    }

    if (requestCheck.rows[0].status === 'closed') {
      return res.status(400).json({ error: 'Request is already closed' });
    }

    await db.query(
      'UPDATE requests SET status = $1 WHERE request_id = $2',
      ['closed', requestID]
    );

    return res.status(200).json({ message: 'Request closed successfully' });
  } catch (error) {
    console.error('Error closing request:', error);
    return res.status(500).json({ error: 'Failed to close request' });
  }
};

module.exports = {
  createRequest,
  deleteRequest,
  getRequestsByUser,
  closeRequest
};