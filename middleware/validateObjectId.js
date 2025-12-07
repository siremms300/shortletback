// middleware/validateObjectId.js
const mongoose = require('mongoose');

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || id === 'undefined') {
      return res.status(400).json({
        message: `${paramName} is required`
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

module.exports = validateObjectId;