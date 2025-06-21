const db = require('../database/db');
const { publisher } = require('../messaging/setup');

// Creates a new review request
const createRequest = async (req, res) => {
  const { courseID } = req.params;
  const { requestBody, profID, gradeID } = req.body;
  // Use dummy user id (integer) if req.user is undefined (for testing without auth)
  const userID = req.user && req.user.id ? req.user.id : 1;

  try {
    if (!requestBody) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const result = await db.query(
      'INSERT INTO requests (owner_id, grade_id, prof_id, request_body, status) VALUES ($1, $2, $3, $4, $5) RETURNING request_id, owner_id, grade_id, prof_id, request_body, status, timestamp',
      [userID, gradeID, profID, requestBody, 'open']
    );

    const newRequest = result.rows[0];

    // Publish the new request to RabbitMQ
    if (publisher.connected) {
      await publisher.publishRequest(newRequest);
    } else {
      console.warn('RabbitMQ publisher not connected, unable to publish request');
    }

    return res.status(201).json({ requestID: newRequest.request_id });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
};

// Deletes a review request
const deleteRequest = async (req, res) => {
  const { requestID } = req.params;
  
  try {
    // Verify request exists
    const requestCheck = await db.query(
      'SELECT request_id FROM requests WHERE request_id = $1',
      [requestID]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Authorization is now handled by middleware
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
  const userID = req.user && req.user.id ? req.user.id : 1;
  const role = req.user && req.user.role ? req.user.role : 'student';
  console.log('Role from token:', role);

  try {
    let result;
    if (role === 'instructor') {
      result = await db.query(
        `SELECT
            r.request_id,
            g.course_name,
            g.semester AS exam_period,
            r.request_body,
            u.first_name || ' ' || u.last_name AS student_name
          FROM requests r
          JOIN grades g ON r.grade_id = g.grade_id
          JOIN users_profile u ON r.owner_id = u.user_service_id
          WHERE r.prof_id = $1
          ORDER BY r.timestamp DESC;`,
        [userID]
      );
    } else {
      result = await db.query(
        'SELECT * FROM requests WHERE owner_id = $1 ORDER BY timestamp DESC',
        [userID]
      );
    }
    return res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error('Error retrieving requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve requests', detail: error.message });
  }
};



// Close a request
const closeRequest = async (req, res) => {
  const { requestID } = req.params;
  
  try {
    // Verify request exists and check status
    const requestCheck = await db.query(
      'SELECT status FROM requests WHERE request_id = $1',
      [requestID]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Authorization is now handled by middleware

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