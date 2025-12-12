// middleware/uploadMiddleware.js - FIXED FOR YOUR ROUTES
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== VERCEL-SAFE DIRECTORY CREATION ==========
const createUploadDirs = () => {
  if (process.env.VERCEL) {
    console.log('⚠️ Skipping directory creation on Vercel (serverless)');
    return;
  }
  
  const dirs = [
    'public/uploads/users',
    'public/uploads/properties',
    'public/uploads/vendor-products',
    'uploads/payments'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// ========== STORAGE CONFIGURATION ==========
const getStorage = (basePath, prefix = 'file') => {
  if (process.env.VERCEL) {
    console.log('📦 Using memory storage for:', basePath);
    return multer.memoryStorage();
  }
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, basePath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `${prefix}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  });
};

// Configure storages based on your routes
const userStorage = getStorage('public/uploads/users', 'user');
const propertyStorage = getStorage('public/uploads/properties', 'property');
const vendorProductStorage = getStorage('public/uploads/vendor-products', 'vendor-product');
const paymentProofStorage = getStorage('uploads/payments', 'payment');

// ========== FILE FILTERS ==========
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const paymentProofFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  }
};

// ========== MULTER INSTANCES ==========
const uploadUserProfile = multer({
  storage: userStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const uploadProperties = multer({
  storage: propertyStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadVendorProducts = multer({
  storage: vendorProductStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== ERROR HANDLING ==========
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
    if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files';
    return res.status(400).json({ message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const handlePaymentProofErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Payment proof upload error' });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ========== VERCEL FILE PROCESSOR ==========
const processVercelFile = (req) => {
  if (process.env.VERCEL && req.file) {
    console.log('📁 Vercel file received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    });
    
    // Add Vercel-specific properties
    req.file.isVercel = true;
    req.file.buffer = req.file.buffer || Buffer.from([]);
    
    // Create a fake path for backward compatibility
    if (!req.file.path) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      
      // Determine fake path based on field name
      let fakePath = '';
      if (req.file.fieldname === 'profileImage') {
        fakePath = `public/uploads/users/user-${uniqueSuffix}${ext}`;
      } else if (req.file.fieldname === 'images') {
        fakePath = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
      } else if (req.file.fieldname === 'proof') {
        fakePath = `uploads/payments/payment-${uniqueSuffix}${ext}`;
      } else {
        fakePath = `uploads/general/file-${uniqueSuffix}${ext}`;
      }
      
      req.file.path = fakePath;
      req.file.filename = path.basename(fakePath);
    }
  }
  
  // Process multiple files
  if (process.env.VERCEL && req.files) {
    req.files = req.files.flat();
    req.files.forEach(file => {
      if (!file.path) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        file.path = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
        file.filename = path.basename(file.path);
        file.isVercel = true;
      }
    });
  }
};

module.exports = {
  uploadUserProfile,
  uploadProperties,
  uploadVendorProducts,
  uploadPaymentProof,
  handleUploadErrors,
  handlePaymentProofErrors,
  processVercelFile
};










































// // middleware/uploadMiddleware.js - FIXED FOR VERCEL
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // ========== VERCEL-SAFE DIRECTORY CREATION ==========
// const createUploadDirs = () => {
//   // SKIP on Vercel - no filesystem write permissions
//   if (process.env.VERCEL) {
//     console.log('⚠️ Skipping directory creation on Vercel (serverless)');
//     return;
//   }
  
//   // Only create directories locally
//   const dirs = [
//     'public/uploads/vendor-products',
//     'public/uploads/properties',
//     'public/uploads/users',
//     'uploads/payments'
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`✅ Created directory: ${dir}`);
//     }
//   });
// };

// // Call it - will be skipped on Vercel
// createUploadDirs();

// // ========== STORAGE CONFIGURATION ==========
// // Use memory storage on Vercel, disk storage locally
// const getStorage = (basePath) => {
//   if (process.env.VERCEL) {
//     console.log('📦 Using memory storage for:', basePath);
//     return multer.memoryStorage();
//   }
  
//   return multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, basePath);
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(file.originalname);
//       const filename = `${path.basename(basePath)}-${uniqueSuffix}${ext}`;
//       cb(null, filename);
//     }
//   });
// };

// // Configure storage for vendor products
// const vendorProductStorage = getStorage('public/uploads/vendor-products/');

// // Configure storage for properties
// const propertyStorage = getStorage('public/uploads/properties/');

// // Configure storage for user profiles
// const userStorage = getStorage('public/uploads/users/');

// // Configure storage for payment proofs
// const paymentProofStorage = getStorage('uploads/payments/');

// // ========== FILE FILTERS ==========
// // File filter for images
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// // File filter for payment proofs
// const paymentProofFileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
//   }
// };

// // ========== MULTER INSTANCES ==========
// const uploadVendorProducts = multer({
//   storage: vendorProductStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   }
// });

// const uploadProperties = multer({
//   storage: propertyStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   }
// });

// const uploadUserProfile = multer({
//   storage: userStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 2 * 1024 * 1024, // 2MB limit
//   }
// });

// const uploadPaymentProof = multer({
//   storage: paymentProofStorage,
//   fileFilter: paymentProofFileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// // ========== ERROR HANDLING MIDDLEWARE ==========
// const handleUploadErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         message: 'File too large. Please upload a smaller file.'
//       });
//     }
//     if (err.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({
//         message: 'Too many files. Please upload fewer files.'
//       });
//     }
//     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//       return res.status(400).json({
//         message: 'Unexpected field. Please check your file upload fields.'
//       });
//     }
//   } else if (err) {
//     console.error('Upload error:', err.message);
//     return res.status(400).json({
//       message: err.message || 'Upload failed'
//     });
//   }
//   next();
// };

// const handlePaymentProofErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File size should be less than 5MB' });
//     }
//     return res.status(400).json({ message: err.message });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// // ========== VERCEL-SPECIFIC HANDLER ==========
// // Helper to handle files on Vercel (files are in memory buffer)
// const handleVercelUpload = (req, res, next) => {
//   if (process.env.VERCEL && req.file) {
//     console.log('Vercel upload - File in memory:', {
//       filename: req.file.originalname,
//       size: req.file.size,
//       mimetype: req.file.mimetype
//     });
    
//     // Files are in req.file.buffer (memory)
//     // For production, you would upload to Cloudinary/S3 here
//     req.file.cloudReady = true; // Mark as ready for cloud upload
//   }
//   next();
// };

// module.exports = {
//   uploadVendorProducts,
//   uploadProperties,
//   uploadUserProfile,
//   handleUploadErrors,
//   uploadPaymentProof,
//   handlePaymentProofErrors,
//   handleVercelUpload
// };
















































// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Ensure upload directories exist
// const createUploadDirs = () => {
//   const dirs = [
//     'public/uploads/vendor-products',
//     'public/uploads/properties',
//     'public/uploads/users'
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//   });
// };

// createUploadDirs();

// // Configure storage for vendor products
// const vendorProductStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/vendor-products/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'vendor-product-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });



// // Configure storage for properties
// const propertyStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/properties/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });



// // Configure storage for user profiles
// const userStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/users/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter for images
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };



// // Configure storage for payment proofs
// const paymentProofStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/payments/');
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter for payment proofs
// const paymentProofFileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
//   }
// };

// // Create multer instances
// const uploadVendorProducts = multer({
//   storage: vendorProductStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   }
// });

// const uploadProperties = multer({
//   storage: propertyStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   }
// });

// const uploadUserProfile = multer({
//   storage: userStorage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 2 * 1024 * 1024, // 2MB limit
//   }
// });

// const uploadPaymentProof = multer({
//   storage: paymentProofStorage,
//   fileFilter: paymentProofFileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// // Error handling middleware
// const handleUploadErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         message: 'File too large. Please upload a smaller file.'
//       });
//     }
//     if (err.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({
//         message: 'Too many files. Please upload fewer files.'
//       });
//     }
//     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//       return res.status(400).json({
//         message: 'Unexpected field. Please check your file upload fields.'
//       });
//     }
//   } else if (err) {
//     return res.status(400).json({
//       message: err.message
//     });
//   }
//   next();
// };

// const handlePaymentProofErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File size should be less than 5MB' });
//     }
//     return res.status(400).json({ message: err.message });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// module.exports = {
//   uploadVendorProducts,
//   uploadProperties,
//   uploadUserProfile,
//   handleUploadErrors,
//   uploadPaymentProof,
//   handlePaymentProofErrors
// };






