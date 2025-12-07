// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');

const authMiddleware = {
  // Verify JWT token
  verifyToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is suspended. Please contact support.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Token is not valid.' });
    }
  },

  // Require admin role
  requireAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  },

  // Optional: Role-based middleware for multiple roles
  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }

      next();
    };
  },

  // Optional: Check if user is owner or admin
  requireOwnerOrAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const resourceUserId = req.params.userId;
    
    // Allow if user is admin OR if user is accessing their own resource
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
  }
};

module.exports = authMiddleware;
















































// // middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
// const User = require('../Models/UserModel');

// const authMiddleware = {
//   // Verify JWT token
//   verifyToken: async (req, res, next) => {
//     try {
//       const token = req.header('Authorization')?.replace('Bearer ', '');
      
//       if (!token) {
//         return res.status(401).json({ message: 'Access denied. No token provided.' });
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id).select('-password');
      
//       if (!user) {
//         return res.status(401).json({ message: 'Token is not valid.' });
//       }

//       req.user = user;
//       next();
//     } catch (error) {
//       console.error('Token verification error:', error);
//       res.status(401).json({ message: 'Token is not valid.' });
//     }
//   },

//   // Optional: Role-based middleware
//   requireRole: (roles) => {
//     return (req, res, next) => {
//       if (!req.user) {
//         return res.status(401).json({ message: 'Authentication required.' });
//       }

//       if (!roles.includes(req.user.role)) {
//         return res.status(403).json({ message: 'Insufficient permissions.' });
//       }

//       next();
//     };
//   }
// };

// module.exports = authMiddleware; 