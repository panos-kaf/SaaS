const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT tokens in requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateJWT = (req, res, next) => {

  //console.log('Auth header received:', authHeader);

  const token = req.headers['x-auth-token'] || req.headers.authorization;

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Store user information from token for use in route handlers
    req.user = user;
    next();
  });
};

/**
 * Middleware to authorize users based on roles
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Middleware function
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ 
        message: 'Access denied: You do not have permission to perform this action' 
      });
    }
  };
};

/**
 * Middleware to verify resource ownership
 * @param {Function} getResourceOwnerIdFn - Function that extracts owner user_service_id from the resource
 * @returns {Function} Middleware function
 */
const verifyResourceOwnership = (getResourceOwnerIdFn) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
      // Get owner ID of the requested resource
      const ownerId = await getResourceOwnerIdFn(req);
      
      // If the user is the owner or has admin role, allow access
      if (req.user.id === ownerId || req.user.role === 'admin') {
        next();
      } else {
        return res.status(403).json({ 
          message: 'Access denied: You do not own this resource' 
        });
      }
    } catch (error) {
      console.error('Error verifying resource ownership:', error);
      return res.status(500).json({ 
        message: 'Internal server error during authorization' 
      });
    }
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
  verifyResourceOwnership
};