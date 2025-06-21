const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
//const { authenticateJWT, authorizeRoles, verifyInstitutionManager } = require('../middleware/auth');

// Function to get institution manager ID for ownership verification
const getInstitutionManagerId = async (req) => {
  const db = require('../database/db');
  const institutionId = req.params.institution_ID;
  
  const result = await db.query(
    'SELECT manager_user_id FROM institutions WHERE institution_id = $1',
    [institutionId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Institution not found');
  }
  
  return result.rows[0].manager_user_id;
};

// Enroll a new institution
// Only authenticated institution representatives can enroll
router.post(
  '/add-inst/',
  //authenticateJWT,
  //authorizeRoles(['institution', 'institution_manager', 'admin']),
  institutionController.enrollInstitution
);

// Add credits to an institution
// Only the institution manager or admin can add credits
router.post(
  '/add-creds/:institution_ID',
  //authenticateJWT,
  //verifyInstitutionManager(getInstitutionManagerId),
  institutionController.addCredits
);

// View credits for an institution
// Only the institution manager or admin can view credits
router.get(
  '/view-creds/:institution_ID',
  //authenticateJWT,
  //verifyInstitutionManager(getInstitutionManagerId),
  institutionController.viewCredits
);

// Register courses for an institution
// Only the institution manager or admin can register courses
router.post(
  '/register-courses/:institution_ID',
  //authenticateJWT,
  //verifyInstitutionManager(getInstitutionManagerId),
  institutionController.registerCourses
);

// Sync existing courses by publishing course events
// Only the institution manager or admin can sync courses
router.post(
  '/sync-courses/:institution_ID',
  //authenticateJWT,
  //verifyInstitutionManager(getInstitutionManagerId),
  institutionController.syncCourses
);

module.exports = router;
