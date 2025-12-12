// middleware/vercelFileHandler.js
const { processVercelFile } = require('./uploadMiddleware');

const vercelFileHandler = (req, res, next) => {
  // Process files for Vercel
  processVercelFile(req);
  next();
};

module.exports = vercelFileHandler;