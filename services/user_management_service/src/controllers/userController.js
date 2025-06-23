const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const config = require('../config/config');
const { publisher } = require('../messaging/setup');
const db = require('../database/db');
const bcrypt = require('bcrypt');

/**
 * User Controller for handling authentication operations
 */
class UserController {
  /**
   * Sign up a new user
   */
  async signUp(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.username || !userData.password || !userData.email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password, and email are required' 
        });
      }
      
      // Check if username already exists
      const existingUser = await userModel.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }
      
      // Check if email already exists
      const existingEmail = await userModel.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }
      
      // Create the user
      const result = await userModel.createUser(userData);
      
      // Get user profile for response
      const userProfile = await userModel.getUserProfileById(result.userId);
      
      // Publish user profile to message queue
      if (publisher.connected) {
        await publisher.publishUserProfile(userProfile);
      } else {
        console.warn('RabbitMQ not connected, unable to publish user profile');
      }
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userProfile
      });
    } catch (error) {
      console.error('Error in signUp:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error during user creation',
        error: error.message
      });
    }
  }
  
  /**
   * Sign in a user
   */
  async signIn(req, res) {
    try {
      const { username, email, password } = req.body;
      const institutionId = req.params.institution_id;
      
      // Validate required fields
      if (!username && !email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username or email required.'}
        );
      }
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password required.' 
        });
      }

      if (!username) {
        user = userModel.getUserByEmail(email);
        username = user.username;
      }
      
      // Authenticate user
      const user = await userModel.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      // Verify institution ID if provided
      if (institutionId && user.institution_id !== parseInt(institutionId, 10)) {
        return res.status(403).json({ 
          success: false, 
          message: 'User does not belong to the specified institution' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          email: user.email,
          role: user.role,
          institution_id: user.institution_id
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          academic_id: user.academic_id,
          first_name: user.first_name,
          last_name: user.last_name,
          institution_id: user.institution_id,
          department: user.department
        }
      });
    } catch (error) {
      console.error('Error in signIn:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error.message
      });
    }
  }



  async updatePassword (req, res) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required." });
    }

    try {
      // Check if user exists
      const userResult = await db.query(
        'SELECT id FROM users_credentials WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const userId = userResult.rows[0].id;

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update the password
      await db.query(
        `UPDATE users_credentials 
        SET password_hash = $1, salt = $2, updated_at = NOW()
        WHERE id = $3`,
        [password_hash, salt, userId]
      );

      return res.status(200).json({
        success: true,
        message: "Password updated successfully."
      });

    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update password.",
        error: error.message
      });
    }
  };


  
  /**
   * Get current user profile (requires authentication)
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await userModel.getUserProfileById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();