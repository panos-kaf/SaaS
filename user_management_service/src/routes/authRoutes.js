const express = require('express');
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /add-user
 * @desc    Register a new user
 * @access  Public
 */
router.post('/add-user', userController.signUp);

// /**
//  * @route   POST /add-creds/:institution_id
//  * @desc    Sign in user and get JWT
//  * @access  Public
//  */
// router.post('/add-creds/:institution_id', userController.signIn);

/**
 * @route   GET /profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateJWT, userController.getProfile);

module.exports = router;