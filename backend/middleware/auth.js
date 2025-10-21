const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          message: 'Not authorized, user not found'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is authority or admin
const isAuthority = (req, res, next) => {
  if (!['authority', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Authority or admin access required'
    });
  }
  next();
};

module.exports = { protect, authorize, isAdmin, isAuthority };
