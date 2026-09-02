const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Authentication Middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this');
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    // Attach user to request
    req.user = user;
    req.user.id = user.id;
    req.user.role = user.role;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token. Please login again.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed.' 
    });
  }
};

// ✅ Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized. Please login.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. ${req.user.role} role not authorized.` 
      });
    }

    next();
  };
};

module.exports = { auth, authorize };