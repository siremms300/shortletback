// middleware/uploadHandler.js - UPDATED
const { handleVercelUpload, cloudinaryMiddleware } = require('./uploadMiddleware');

/**
 * Universal upload handler with Cloudinary support
 */
const createUploadHandler = (multerMiddleware) => {
  return async (req, res, next) => {
    if (process.env.VERCEL) {
      // On Vercel: Use the middleware but add special handling
      multerMiddleware(req, res, async (err) => {
        if (err) {
          console.log('Vercel upload middleware error (non-critical):', err.message);
          // Continue anyway - files will be handled in memory
        }
        
        // Process files for Vercel and Cloudinary
        try {
          // First process Vercel-specific handling
          if (req.file || req.files) {
            await handleVercelUpload(req, res, async () => {
              // Then process Cloudinary if configured
              if (cloudinaryMiddleware) {
                await cloudinaryMiddleware(req, res, next);
              } else {
                next();
              }
            });
          } else {
            next();
          }
        } catch (error) {
          console.error('Error in upload handler:', error);
          next(error);
        }
      });
    } else {
      // Local: Use normal middleware with Cloudinary support
      multerMiddleware(req, res, async (err) => {
        if (err) {
          return next(err);
        } 
        
        // Process for Cloudinary if configured
        if (cloudinaryMiddleware && (req.file || req.files)) {
          await cloudinaryMiddleware(req, res, next);
        } else {
          next();
        }
      });
    }
  };
};

module.exports = { createUploadHandler };
















































// // middleware/uploadHandler.js - UPDATED
// const { handleVercelUpload, cloudinaryMiddleware } = require('./uploadMiddleware');

// /**
//  * Universal upload handler with Cloudinary support
//  */
// const createUploadHandler = (multerMiddleware) => {
//   return async (req, res, next) => {
//     if (process.env.VERCEL) {
//       // On Vercel: Use the middleware but add special handling
//       multerMiddleware(req, res, async (err) => {
//         if (err) {
//           console.log('Vercel upload middleware error (non-critical):', err.message);
//           // Continue anyway - files will be handled in memory
//         }
        
//         // Process files for Vercel and Cloudinary
//         try {
//           // First process Vercel-specific handling
//           if (req.file || req.files) {
//             await handleVercelUpload(req, res, async () => {
//               // Then process Cloudinary if configured
//               if (cloudinaryMiddleware) {
//                 await cloudinaryMiddleware(req, res, next);
//               } else {
//                 next();
//               }
//             });
//           } else {
//             next();
//           }
//         } catch (error) {
//           console.error('Error in upload handler:', error);
//           next(error);
//         }
//       });
//     } else {
//       // Local: Use normal middleware with Cloudinary support
//       multerMiddleware(req, res, async (err) => {
//         if (err) {
//           return next(err);
//         }
        
//         // Process for Cloudinary if configured
//         if (cloudinaryMiddleware && (req.file || req.files)) {
//           await cloudinaryMiddleware(req, res, next);
//         } else {
//           next();
//         }
//       });
//     }
//   };
// };

// module.exports = { createUploadHandler };



















































// // middleware/uploadHandler.js
// const { handleVercelUpload } = require('./uploadMiddleware');

// /**
//  * Universal upload handler for Vercel compatibility
//  * Wraps Multer middleware with Vercel-specific handling
//  */
// const createUploadHandler = (multerMiddleware) => {
//   return (req, res, next) => {
//     if (process.env.VERCEL) {
//       // On Vercel: Use the middleware but add special handling
//       multerMiddleware(req, res, (err) => {
//         if (err) {
//           console.log('Vercel upload middleware error (non-critical):', err.message);
//           // Continue anyway - files will be handled in memory
//         }
        
//         // Process files for Vercel
//         handleVercelUpload(req, res, () => {
//           next();
//         });
//       });
//     } else {
//       // Local: Use normal middleware
//       multerMiddleware(req, res, next);
//     }
//   };
// };

// module.exports = { createUploadHandler };



