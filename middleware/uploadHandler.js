// middleware/uploadHandler.js
const { handleVercelUpload } = require('./uploadMiddleware');

/**
 * Universal upload handler for Vercel compatibility
 * Wraps Multer middleware with Vercel-specific handling
 */
const createUploadHandler = (multerMiddleware) => {
  return (req, res, next) => {
    if (process.env.VERCEL) {
      // On Vercel: Use the middleware but add special handling
      multerMiddleware(req, res, (err) => {
        if (err) {
          console.log('Vercel upload middleware error (non-critical):', err.message);
          // Continue anyway - files will be handled in memory
        }
        
        // Process files for Vercel
        handleVercelUpload(req, res, () => {
          next();
        });
      });
    } else {
      // Local: Use normal middleware
      multerMiddleware(req, res, next);
    }
  };
};

module.exports = { createUploadHandler };