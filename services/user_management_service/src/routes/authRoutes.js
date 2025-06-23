const express = require('express');
const userController = require('../controllers/userController');
//const { authenticateJWT } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const userModel = require('../models/userModel');


/**
 * @route   POST /add-user
 * @desc    Register a new user
 * @access  Public
 */
router.post('/add-user', userController.signUp);
router.post('/signup', userController.signUp); // alias for /add-user
router.post('/update-pass', userController.updatePassword);

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
router.get('/profile', userController.getProfile);

/** * @route   POST /signin/:institution_id?
 * @desc    Sign in user and get JWT
 * @access  Public
 * institution_id is optional, used for institution-specific sign-in
 */
router.post('/signin/:institution_id?', userController.signIn); // institution_id is optional

// Log in through Google API

router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    const profile = req.user;

    try {
      const dbUser = await userModel.getUserByEmail(profile.email);

      if (!dbUser) {
        // Αν δεν υπάρχει ο χρήστης στη βάση
        return res.redirect('http://localhost:4000/login?error=user_not_found');
      }

      // Αν υπάρχει στη βάση → βγάλε JWT
      const token = jwt.sign(
        {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // redirect με token
      res.redirect(`http://localhost:4000/oauth-success?token=${token}&role=${dbUser.role}`);
    } catch (err) {
      console.error('Google login error:', err);
      res.redirect('http://localhost:4000/login?error=server');
    }
  }
);


module.exports = router;