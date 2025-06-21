const jwt = require('jsonwebtoken');
const config = require('../config/config');

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