const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  uploadToCloudinary, 
  uploadToCloudinaryFromFile,
  isCloudinaryConfigured 
} = require('../utils/cloudStorage');

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
    'public/uploads/expenses', // Add expenses directory
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
  // Use Cloudinary if configured, otherwise use disk/memory storage
  if (isCloudinaryConfigured()) {
    console.log('☁️ Using Cloudinary storage');
    return multer.memoryStorage(); // Store files in memory for Cloudinary upload
  } else if (process.env.VERCEL) {
    console.log('📦 Using memory storage for Vercel');
    return multer.memoryStorage();
  }
  
  console.log('💾 Using disk storage');
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
const expenseReceiptStorage = getStorage('public/uploads/expenses', 'expense'); // Add this

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

const expenseReceiptFileFilter = (req, file, cb) => {
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
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

// Add expense receipt upload
const uploadExpenseReceipt = multer({
  storage: expenseReceiptStorage,
  fileFilter: expenseReceiptFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== CLOUDINARY PROCESSING ==========
const processFileForCloudinary = async (req, folder = 'general') => {
  if (!isCloudinaryConfigured()) {
    return; // Skip if Cloudinary not configured
  }

  // Process single file
  if (req.file) {
    console.log('☁️ Processing file for Cloudinary:', req.file.originalname);
    
    try {
      // Determine folder based on file type/context
      let cloudinaryFolder = `holsapartments/${folder}`;
      
      if (req.file.fieldname === 'profileImage') {
        cloudinaryFolder = 'holsapartments/users';
      } else if (req.file.fieldname === 'images') {
        cloudinaryFolder = 'holsapartments/properties';
      } else if (req.file.fieldname === 'proof') {
        cloudinaryFolder = 'holsapartments/payments';
      } else if (req.file.fieldname === 'receipt') {
        cloudinaryFolder = 'holsapartments/expenses';
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: cloudinaryFolder,
        public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mimeType: req.file.mimetype,
        resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      });

      // Store Cloudinary info in the file object
      req.file.cloudinary = {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        version: result.version,
        signature: result.signature
      };

      // For backward compatibility, keep the path field
      req.file.path = result.secure_url;
      req.file.filename = result.public_id.split('/').pop();

      console.log('✅ File uploaded to Cloudinary:', result.secure_url);
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      // Keep local file info as fallback
    }
  }

  // Process multiple files
  if (req.files && req.files.length > 0) {
    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    for (const file of filesArray) {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'holsapartments/properties',
          public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mimeType: file.mimetype
        });

        file.cloudinary = {
          url: result.secure_url,
          public_id: result.public_id
        };
        file.path = result.secure_url;
        file.filename = result.public_id.split('/').pop();
      } catch (error) {
        console.error('Cloudinary upload failed for:', file.originalname, error);
      }
    }
  }
};

// ========== VERCEL FILE PROCESSOR ==========
const handleVercelUpload = async (req, res, next) => {
  if (process.env.VERCEL && req.file) {
    console.log('📁 Vercel file received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    req.file.isVercel = true;
    
    // If Cloudinary is configured, upload to Cloudinary
    if (isCloudinaryConfigured()) {
      await processFileForCloudinary(req);
    } else {
      // Fallback: create fake path for Vercel
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      
      let fakePath = '';
      if (req.file.fieldname === 'profileImage') {
        fakePath = `public/uploads/users/user-${uniqueSuffix}${ext}`;
      } else if (req.file.fieldname === 'images') {
        fakePath = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
      } else if (req.file.fieldname === 'proof') {
        fakePath = `uploads/payments/payment-${uniqueSuffix}${ext}`;
      } else if (req.file.fieldname === 'receipt') {
        fakePath = `public/uploads/expenses/expense-${uniqueSuffix}${ext}`;
      } else {
        fakePath = `uploads/general/file-${uniqueSuffix}${ext}`;
      }
      
      req.file.path = fakePath;
      req.file.filename = path.basename(fakePath);
    }
  }
  
  // Process multiple files
  if (process.env.VERCEL && req.files) {
    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    for (const file of filesArray) {
      file.isVercel = true;
      
      if (isCloudinaryConfigured()) {
        try {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'holsapartments/properties',
            public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            mimeType: file.mimetype
          });

          file.cloudinary = {
            url: result.secure_url,
            public_id: result.public_id
          };
          file.path = result.secure_url;
          file.filename = result.public_id.split('/').pop();
        } catch (error) {
          console.error('Cloudinary upload failed:', error);
        }
      } else {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        file.path = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
        file.filename = path.basename(file.path);
      }
    }
  }
  
  next();
};

// ========== ERROR HANDLING MIDDLEWARE ==========
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (max 5MB)';
    if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Unexpected file field';
    return res.status(400).json({ message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const handlePaymentProofErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Payment proof upload error: ' + err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const handleExpenseReceiptErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Receipt upload error: ' + err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ========== CLOUDINARY MIDDLEWARE ==========
const cloudinaryMiddleware = async (req, res, next) => {
  try {
    // Only process if Cloudinary is configured and we have files
    if (isCloudinaryConfigured() && (req.file || req.files)) {
      await processFileForCloudinary(req);
    }
    next();
  } catch (error) {
    console.error('Cloudinary middleware error:', error);
    next(error);
  }
};

module.exports = {
  uploadUserProfile,
  uploadProperties,
  uploadVendorProducts,
  uploadPaymentProof,
  uploadExpenseReceipt, // Add this
  handleUploadErrors,
  handlePaymentProofErrors,
  handleExpenseReceiptErrors, // Add this
  handleVercelUpload,
  cloudinaryMiddleware,
  processFileForCloudinary,
  isCloudinaryConfigured,
};

















































// // middleware/uploadMiddleware.js - COMPLETE FIXED VERSION
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const { 
//   uploadToCloudinary, 
//   uploadToCloudinaryFromFile,
//   isCloudinaryConfigured 
// } = require('../utils/cloudStorage');

// // ========== VERCEL-SAFE DIRECTORY CREATION ==========
// const createUploadDirs = () => {
//   if (process.env.VERCEL) {
//     console.log('⚠️ Skipping directory creation on Vercel (serverless)');
//     return;
//   }
  
//   const dirs = [
//     'public/uploads/users',
//     'public/uploads/properties',
//     'public/uploads/vendor-products',
//     'uploads/payments'
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`✅ Created directory: ${dir}`);
//     }
//   });
// };

// createUploadDirs();

// // ========== STORAGE CONFIGURATION ==========
// const getStorage = (basePath, prefix = 'file') => {
//   // Use Cloudinary if configured, otherwise use disk/memory storage
//   if (isCloudinaryConfigured()) {
//     console.log('☁️ Using Cloudinary storage');
//     return multer.memoryStorage(); // Store files in memory for Cloudinary upload
//   } else if (process.env.VERCEL) {
//     console.log('📦 Using memory storage for Vercel');
//     return multer.memoryStorage();
//   }
  
//   console.log('💾 Using disk storage');
//   return multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, basePath);
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(file.originalname);
//       const filename = `${prefix}-${uniqueSuffix}${ext}`;
//       cb(null, filename);
//     }
//   });
// };

// // Configure storages based on your routes
// const userStorage = getStorage('public/uploads/users', 'user');
// const propertyStorage = getStorage('public/uploads/properties', 'property');
// const vendorProductStorage = getStorage('public/uploads/vendor-products', 'vendor-product');
// const paymentProofStorage = getStorage('uploads/payments', 'payment');

// // ========== FILE FILTERS ==========
// const imageFileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// const paymentProofFileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
//   }
// };

// // ========== MULTER INSTANCES ==========
// const uploadUserProfile = multer({
//   storage: userStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 15 * 1024 * 1024 } // 5MB
// });

// const uploadProperties = multer({
//   storage: propertyStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 15 * 1024 * 1024 } // 10MB
// });

// const uploadVendorProducts = multer({
//   storage: vendorProductStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 15 * 1024 * 1024 } // 5MB
// });

// const uploadPaymentProof = multer({
//   storage: paymentProofStorage,
//   fileFilter: paymentProofFileFilter,
//   limits: { fileSize: 15 * 1024 * 1024 } // 5MB
// });

// // ========== CLOUDINARY PROCESSING ==========
// const processFileForCloudinary = async (req, folder = 'general') => {
//   if (!isCloudinaryConfigured()) {
//     return; // Skip if Cloudinary not configured
//   }

//   // Process single file
//   if (req.file) {
//     console.log('☁️ Processing file for Cloudinary:', req.file.originalname);
    
//     try {
//       // Determine folder based on file type/context
//       let cloudinaryFolder = `holsapartments/${folder}`;
      
//       if (req.file.fieldname === 'profileImage') {
//         cloudinaryFolder = 'holsapartments/users';
//       } else if (req.file.fieldname === 'images') {
//         cloudinaryFolder = 'holsapartments/properties';
//       } else if (req.file.fieldname === 'proof') {
//         cloudinaryFolder = 'holsapartments/payments';
//       }

//       // Upload to Cloudinary
//       const result = await uploadToCloudinary(req.file.buffer, {
//         folder: cloudinaryFolder,
//         public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//         mimeType: req.file.mimetype,
//         resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
//       });

//       // Store Cloudinary info in the file object
//       req.file.cloudinary = {
//         url: result.secure_url,
//         public_id: result.public_id,
//         format: result.format,
//         version: result.version,
//         signature: result.signature
//       };

//       // For backward compatibility, keep the path field
//       req.file.path = result.secure_url;
//       req.file.filename = result.public_id.split('/').pop();

//       console.log('✅ File uploaded to Cloudinary:', result.secure_url);
//     } catch (error) {
//       console.error('❌ Cloudinary upload failed:', error);
//       // Keep local file info as fallback
//     }
//   }

//   // Process multiple files
//   if (req.files) {
//     req.files = req.files.flat();
//     for (const file of req.files) {
//       try {
//         const result = await uploadToCloudinary(file.buffer, {
//           folder: 'holsapartments/properties',
//           public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//           mimeType: file.mimetype
//         });

//         file.cloudinary = {
//           url: result.secure_url,
//           public_id: result.public_id
//         };
//         file.path = result.secure_url;
//         file.filename = result.public_id.split('/').pop();
//       } catch (error) {
//         console.error('Cloudinary upload failed for:', file.originalname, error);
//       }
//     }
//   }
// };

// // ========== VERCEL FILE PROCESSOR ==========
// const handleVercelUpload = async (req, res, next) => {
//   if (process.env.VERCEL && req.file) {
//     console.log('📁 Vercel file received:', {
//       originalname: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size
//     });
    
//     req.file.isVercel = true;
    
//     // If Cloudinary is configured, upload to Cloudinary
//     if (isCloudinaryConfigured()) {
//       await processFileForCloudinary(req);
//     } else {
//       // Fallback: create fake path for Vercel
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(req.file.originalname);
      
//       let fakePath = '';
//       if (req.file.fieldname === 'profileImage') {
//         fakePath = `public/uploads/users/user-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'images') {
//         fakePath = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'proof') {
//         fakePath = `uploads/payments/payment-${uniqueSuffix}${ext}`;
//       } else {
//         fakePath = `uploads/general/file-${uniqueSuffix}${ext}`;
//       }
      
//       req.file.path = fakePath;
//       req.file.filename = path.basename(fakePath);
//     }
//   }
  
//   // Process multiple files
//   if (process.env.VERCEL && req.files) {
//     req.files = req.files.flat();
    
//     for (const file of req.files) {
//       file.isVercel = true;
      
//       if (isCloudinaryConfigured()) {
//         try {
//           const result = await uploadToCloudinary(file.buffer, {
//             folder: 'holsapartments/properties',
//             public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//             mimeType: file.mimetype
//           });

//           file.cloudinary = {
//             url: result.secure_url,
//             public_id: result.public_id
//           };
//           file.path = result.secure_url;
//           file.filename = result.public_id.split('/').pop();
//         } catch (error) {
//           console.error('Cloudinary upload failed:', error);
//         }
//       } else {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         file.path = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//         file.filename = path.basename(file.path);
//       }
//     }
//   }
  
//   next();
// };

// // ========== ERROR HANDLING MIDDLEWARE ==========
// const handleUploadErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     let message = 'File upload error';
//     if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
//     if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files';
//     return res.status(400).json({ message });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// const handlePaymentProofErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ message: 'Payment proof upload error' });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// // ========== CLOUDINARY MIDDLEWARE ==========
// const cloudinaryMiddleware = async (req, res, next) => {
//   try {
//     // Only process if Cloudinary is configured and we have files
//     if (isCloudinaryConfigured() && (req.file || req.files)) {
//       await processFileForCloudinary(req);
//     }
//     next();
//   } catch (error) {
//     console.error('Cloudinary middleware error:', error);
//     next(error);
//   }
// };











 





// module.exports = {
//   uploadUserProfile,
//   uploadProperties,
//   uploadVendorProducts,
//   uploadPaymentProof,
//   handleUploadErrors,
//   handlePaymentProofErrors,
//   handleVercelUpload,
//   cloudinaryMiddleware,
//   processFileForCloudinary,
//   isCloudinaryConfigured
// };























































































// // middleware/uploadMiddleware.js - UPDATED WITH CLOUDINARY
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const { 
//   uploadToCloudinary, 
//   uploadToCloudinaryFromFile,
//   isCloudinaryConfigured 
// } = require('../utils/cloudStorage');

// // ========== VERCEL-SAFE DIRECTORY CREATION ==========
// const createUploadDirs = () => {
//   if (process.env.VERCEL) {
//     console.log('⚠️ Skipping directory creation on Vercel (serverless)');
//     return;
//   }
  
//   const dirs = [
//     'public/uploads/users',
//     'public/uploads/properties',
//     'public/uploads/vendor-products',
//     'uploads/payments'
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`✅ Created directory: ${dir}`);
//     }
//   });
// };

// createUploadDirs();

// // ========== STORAGE CONFIGURATION ==========
// const getStorage = (basePath, prefix = 'file') => {
//   // Use Cloudinary if configured, otherwise use disk/memory storage
//   if (isCloudinaryConfigured()) {
//     console.log('☁️ Using Cloudinary storage');
//     return multer.memoryStorage(); // Store files in memory for Cloudinary upload
//   } else if (process.env.VERCEL) {
//     console.log('📦 Using memory storage for Vercel');
//     return multer.memoryStorage();
//   }
  
//   console.log('💾 Using disk storage');
//   return multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, basePath);
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(file.originalname);
//       const filename = `${prefix}-${uniqueSuffix}${ext}`;
//       cb(null, filename);
//     }
//   });
// };

// // Configure storages based on your routes
// const userStorage = getStorage('public/uploads/users', 'user');
// const propertyStorage = getStorage('public/uploads/properties', 'property');
// const vendorProductStorage = getStorage('public/uploads/vendor-products', 'vendor-product');
// const paymentProofStorage = getStorage('uploads/payments', 'payment');

// // ========== FILE FILTERS ==========
// const imageFileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// const paymentProofFileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
//   }
// };

// // ========== MULTER INSTANCES ==========
// const uploadUserProfile = multer({
//   storage: userStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

// const uploadProperties = multer({
//   storage: propertyStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 } // 10MB
// });

// const uploadVendorProducts = multer({
//   storage: vendorProductStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

// const uploadPaymentProof = multer({
//   storage: paymentProofStorage,
//   fileFilter: paymentProofFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

// // ========== CLOUDINARY PROCESSING ==========
// const processFileForCloudinary = async (req, folder = 'general') => {
//   if (!isCloudinaryConfigured()) {
//     return; // Skip if Cloudinary not configured
//   }

//   // Process single file
//   if (req.file) {
//     console.log('☁️ Processing file for Cloudinary:', req.file.originalname);
    
//     try {
//       // Determine folder based on file type/context
//       let cloudinaryFolder = `holsapartments/${folder}`;
      
//       if (req.file.fieldname === 'profileImage') {
//         cloudinaryFolder = 'holsapartments/users';
//       } else if (req.file.fieldname === 'images') {
//         cloudinaryFolder = 'holsapartments/properties';
//       } else if (req.file.fieldname === 'proof') {
//         cloudinaryFolder = 'holsapartments/payments';
//       }

//       // Upload to Cloudinary
//       const result = await uploadToCloudinary(req.file.buffer, {
//         folder: cloudinaryFolder,
//         public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//         mimeType: req.file.mimetype,
//         resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
//       });

//       // Store Cloudinary info in the file object
//       req.file.cloudinary = {
//         url: result.secure_url,
//         public_id: result.public_id,
//         format: result.format,
//         version: result.version,
//         signature: result.signature
//       };

//       // For backward compatibility, keep the path field
//       req.file.path = result.secure_url;
//       req.file.filename = result.public_id.split('/').pop();

//       console.log('✅ File uploaded to Cloudinary:', result.secure_url);
//     } catch (error) {
//       console.error('❌ Cloudinary upload failed:', error);
//       // Keep local file info as fallback
//     }
//   }

//   // Process multiple files
//   if (req.files) {
//     req.files = req.files.flat();
//     for (const file of req.files) {
//       try {
//         const result = await uploadToCloudinary(file.buffer, {
//           folder: 'holsapartments/properties',
//           public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//           mimeType: file.mimetype
//         });

//         file.cloudinary = {
//           url: result.secure_url,
//           public_id: result.public_id
//         };
//         file.path = result.secure_url;
//         file.filename = result.public_id.split('/').pop();
//       } catch (error) {
//         console.error('Cloudinary upload failed for:', file.originalname, error);
//       }
//     }
//   }
// };

// // ========== VERCEL FILE PROCESSOR ==========
// const processVercelFile = async (req) => {
//   if (process.env.VERCEL && req.file) {
//     console.log('📁 Vercel file received:', {
//       originalname: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size
//     });
    
//     req.file.isVercel = true;
    
//     // If Cloudinary is configured, upload to Cloudinary
//     if (isCloudinaryConfigured()) {
//       await processFileForCloudinary(req);
//     } else {
//       // Fallback: create fake path for Vercel
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(req.file.originalname);
      
//       let fakePath = '';
//       if (req.file.fieldname === 'profileImage') {
//         fakePath = `public/uploads/users/user-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'images') {
//         fakePath = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'proof') {
//         fakePath = `uploads/payments/payment-${uniqueSuffix}${ext}`;
//       } else {
//         fakePath = `uploads/general/file-${uniqueSuffix}${ext}`;
//       }
      
//       req.file.path = fakePath;
//       req.file.filename = path.basename(fakePath);
//     }
//   }
  
//   // Process multiple files
//   if (process.env.VERCEL && req.files) {
//     req.files = req.files.flat();
    
//     for (const file of req.files) {
//       file.isVercel = true;
      
//       if (isCloudinaryConfigured()) {
//         try {
//           const result = await uploadToCloudinary(file.buffer, {
//             folder: 'holsapartments/properties',
//             public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//             mimeType: file.mimetype
//           });

//           file.cloudinary = {
//             url: result.secure_url,
//             public_id: result.public_id
//           };
//           file.path = result.secure_url;
//           file.filename = result.public_id.split('/').pop();
//         } catch (error) {
//           console.error('Cloudinary upload failed:', error);
//         }
//       } else {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         file.path = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//         file.filename = path.basename(file.path);
//       }
//     }
//   }
// };

// // ========== MIDDLEWARE FOR CLOUDINARY PROCESSING ==========
// const cloudinaryMiddleware = async (req, res, next) => {
//   try {
//     // Only process if Cloudinary is configured and we have files
//     if (isCloudinaryConfigured() && (req.file || req.files)) {
//       await processFileForCloudinary(req);
//     }
//     next();
//   } catch (error) {
//     console.error('Cloudinary middleware error:', error);
//     next(error);
//   }
// };

// module.exports = {
//   uploadUserProfile,
//   uploadProperties,
//   uploadVendorProducts,
//   uploadPaymentProof,
//   handleUploadErrors,
//   handlePaymentProofErrors,
//   processVercelFile,
//   cloudinaryMiddleware,
//   processFileForCloudinary,
//   isCloudinaryConfigured
// };




































// // middleware/uploadMiddleware.js - FIXED FOR YOUR ROUTES
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // ========== VERCEL-SAFE DIRECTORY CREATION ==========
// const createUploadDirs = () => {
//   if (process.env.VERCEL) {
//     console.log('⚠️ Skipping directory creation on Vercel (serverless)');
//     return;
//   }
  
//   const dirs = [
//     'public/uploads/users',
//     'public/uploads/properties',
//     'public/uploads/vendor-products',
//     'uploads/payments'
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`✅ Created directory: ${dir}`);
//     }
//   });
// };

// createUploadDirs();

// // ========== STORAGE CONFIGURATION ==========
// const getStorage = (basePath, prefix = 'file') => {
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
//       const filename = `${prefix}-${uniqueSuffix}${ext}`;
//       cb(null, filename);
//     }
//   });
// };

// // Configure storages based on your routes
// const userStorage = getStorage('public/uploads/users', 'user');
// const propertyStorage = getStorage('public/uploads/properties', 'property');
// const vendorProductStorage = getStorage('public/uploads/vendor-products', 'vendor-product');
// const paymentProofStorage = getStorage('uploads/payments', 'payment');

// // ========== FILE FILTERS ==========
// const imageFileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// const paymentProofFileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
//   }
// };

// // ========== MULTER INSTANCES ==========
// const uploadUserProfile = multer({
//   storage: userStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 2 * 1024 * 1024 } // 2MB
// });

// const uploadProperties = multer({
//   storage: propertyStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 } // 10MB
// });

// const uploadVendorProducts = multer({
//   storage: vendorProductStorage,
//   fileFilter: imageFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

// const uploadPaymentProof = multer({
//   storage: paymentProofStorage,
//   fileFilter: paymentProofFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

// // ========== ERROR HANDLING ==========
// const handleUploadErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     let message = 'File upload error';
//     if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large';
//     if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files';
//     return res.status(400).json({ message });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// const handlePaymentProofErrors = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ message: 'Payment proof upload error' });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// // ========== VERCEL FILE PROCESSOR ==========
// const processVercelFile = (req) => {
//   if (process.env.VERCEL && req.file) {
//     console.log('📁 Vercel file received:', {
//       originalname: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//       fieldname: req.file.fieldname
//     });
    
//     // Add Vercel-specific properties
//     req.file.isVercel = true;
//     req.file.buffer = req.file.buffer || Buffer.from([]);
    
//     // Create a fake path for backward compatibility
//     if (!req.file.path) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const ext = path.extname(req.file.originalname);
      
//       // Determine fake path based on field name
//       let fakePath = '';
//       if (req.file.fieldname === 'profileImage') {
//         fakePath = `public/uploads/users/user-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'images') {
//         fakePath = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//       } else if (req.file.fieldname === 'proof') {
//         fakePath = `uploads/payments/payment-${uniqueSuffix}${ext}`;
//       } else {
//         fakePath = `uploads/general/file-${uniqueSuffix}${ext}`;
//       }
      
//       req.file.path = fakePath;
//       req.file.filename = path.basename(fakePath);
//     }
//   }
  
//   // Process multiple files
//   if (process.env.VERCEL && req.files) {
//     req.files = req.files.flat();
//     req.files.forEach(file => {
//       if (!file.path) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         file.path = `public/uploads/properties/property-${uniqueSuffix}${ext}`;
//         file.filename = path.basename(file.path);
//         file.isVercel = true;
//       }
//     });
//   }
// };

// module.exports = {
//   uploadUserProfile,
//   uploadProperties,
//   uploadVendorProducts,
//   uploadPaymentProof,
//   handleUploadErrors,
//   handlePaymentProofErrors,
//   processVercelFile
// };










































// // // middleware/uploadMiddleware.js - FIXED FOR VERCEL
// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs');

// // // ========== VERCEL-SAFE DIRECTORY CREATION ==========
// // const createUploadDirs = () => {
// //   // SKIP on Vercel - no filesystem write permissions
// //   if (process.env.VERCEL) {
// //     console.log('⚠️ Skipping directory creation on Vercel (serverless)');
// //     return;
// //   }
  
// //   // Only create directories locally
// //   const dirs = [
// //     'public/uploads/vendor-products',
// //     'public/uploads/properties',
// //     'public/uploads/users',
// //     'uploads/payments'
// //   ];
  
// //   dirs.forEach(dir => {
// //     if (!fs.existsSync(dir)) {
// //       fs.mkdirSync(dir, { recursive: true });
// //       console.log(`✅ Created directory: ${dir}`);
// //     }
// //   });
// // };

// // // Call it - will be skipped on Vercel
// // createUploadDirs();

// // // ========== STORAGE CONFIGURATION ==========
// // // Use memory storage on Vercel, disk storage locally
// // const getStorage = (basePath) => {
// //   if (process.env.VERCEL) {
// //     console.log('📦 Using memory storage for:', basePath);
// //     return multer.memoryStorage();
// //   }
  
// //   return multer.diskStorage({
// //     destination: (req, file, cb) => {
// //       cb(null, basePath);
// //     },
// //     filename: (req, file, cb) => {
// //       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //       const ext = path.extname(file.originalname);
// //       const filename = `${path.basename(basePath)}-${uniqueSuffix}${ext}`;
// //       cb(null, filename);
// //     }
// //   });
// // };

// // // Configure storage for vendor products
// // const vendorProductStorage = getStorage('public/uploads/vendor-products/');

// // // Configure storage for properties
// // const propertyStorage = getStorage('public/uploads/properties/');

// // // Configure storage for user profiles
// // const userStorage = getStorage('public/uploads/users/');

// // // Configure storage for payment proofs
// // const paymentProofStorage = getStorage('uploads/payments/');

// // // ========== FILE FILTERS ==========
// // // File filter for images
// // const fileFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith('image/')) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only image files are allowed!'), false);
// //   }
// // };

// // // File filter for payment proofs
// // const paymentProofFileFilter = (req, file, cb) => {
// //   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
// //   if (allowedTypes.includes(file.mimetype)) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
// //   }
// // };

// // // ========== MULTER INSTANCES ==========
// // const uploadVendorProducts = multer({
// //   storage: vendorProductStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 5 * 1024 * 1024, // 5MB limit
// //   }
// // });

// // const uploadProperties = multer({
// //   storage: propertyStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 10 * 1024 * 1024, // 10MB limit
// //   }
// // });

// // const uploadUserProfile = multer({
// //   storage: userStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 2 * 1024 * 1024, // 2MB limit
// //   }
// // });

// // const uploadPaymentProof = multer({
// //   storage: paymentProofStorage,
// //   fileFilter: paymentProofFileFilter,
// //   limits: {
// //     fileSize: 5 * 1024 * 1024 // 5MB limit
// //   }
// // });

// // // ========== ERROR HANDLING MIDDLEWARE ==========
// // const handleUploadErrors = (err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     if (err.code === 'LIMIT_FILE_SIZE') {
// //       return res.status(400).json({
// //         message: 'File too large. Please upload a smaller file.'
// //       });
// //     }
// //     if (err.code === 'LIMIT_FILE_COUNT') {
// //       return res.status(400).json({
// //         message: 'Too many files. Please upload fewer files.'
// //       });
// //     }
// //     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
// //       return res.status(400).json({
// //         message: 'Unexpected field. Please check your file upload fields.'
// //       });
// //     }
// //   } else if (err) {
// //     console.error('Upload error:', err.message);
// //     return res.status(400).json({
// //       message: err.message || 'Upload failed'
// //     });
// //   }
// //   next();
// // };

// // const handlePaymentProofErrors = (err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     if (err.code === 'LIMIT_FILE_SIZE') {
// //       return res.status(400).json({ message: 'File size should be less than 5MB' });
// //     }
// //     return res.status(400).json({ message: err.message });
// //   } else if (err) {
// //     return res.status(400).json({ message: err.message });
// //   }
// //   next();
// // };

// // // ========== VERCEL-SPECIFIC HANDLER ==========
// // // Helper to handle files on Vercel (files are in memory buffer)
// // const handleVercelUpload = (req, res, next) => {
// //   if (process.env.VERCEL && req.file) {
// //     console.log('Vercel upload - File in memory:', {
// //       filename: req.file.originalname,
// //       size: req.file.size,
// //       mimetype: req.file.mimetype
// //     });
    
// //     // Files are in req.file.buffer (memory)
// //     // For production, you would upload to Cloudinary/S3 here
// //     req.file.cloudReady = true; // Mark as ready for cloud upload
// //   }
// //   next();
// // };

// // module.exports = {
// //   uploadVendorProducts,
// //   uploadProperties,
// //   uploadUserProfile,
// //   handleUploadErrors,
// //   uploadPaymentProof,
// //   handlePaymentProofErrors,
// //   handleVercelUpload
// // };
















































// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs');

// // // Ensure upload directories exist
// // const createUploadDirs = () => {
// //   const dirs = [
// //     'public/uploads/vendor-products',
// //     'public/uploads/properties',
// //     'public/uploads/users'
// //   ];
  
// //   dirs.forEach(dir => {
// //     if (!fs.existsSync(dir)) {
// //       fs.mkdirSync(dir, { recursive: true });
// //     }
// //   });
// // };

// // createUploadDirs();

// // // Configure storage for vendor products
// // const vendorProductStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'public/uploads/vendor-products/');
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, 'vendor-product-' + uniqueSuffix + path.extname(file.originalname));
// //   }
// // });



// // // Configure storage for properties
// // const propertyStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'public/uploads/properties/');
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
// //   }
// // });



// // // Configure storage for user profiles
// // const userStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'public/uploads/users/');
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
// //   }
// // });

// // // File filter for images
// // const fileFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith('image/')) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only image files are allowed!'), false);
// //   }
// // };



// // // Configure storage for payment proofs
// // const paymentProofStorage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, 'uploads/payments/');
// //   },
// //   filename: function (req, file, cb) {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
// //   }
// // });

// // // File filter for payment proofs
// // const paymentProofFileFilter = (req, file, cb) => {
// //   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
// //   if (allowedTypes.includes(file.mimetype)) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
// //   }
// // };

// // // Create multer instances
// // const uploadVendorProducts = multer({
// //   storage: vendorProductStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 5 * 1024 * 1024, // 5MB limit
// //   }
// // });

// // const uploadProperties = multer({
// //   storage: propertyStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 10 * 1024 * 1024, // 10MB limit
// //   }
// // });

// // const uploadUserProfile = multer({
// //   storage: userStorage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 2 * 1024 * 1024, // 2MB limit
// //   }
// // });

// // const uploadPaymentProof = multer({
// //   storage: paymentProofStorage,
// //   fileFilter: paymentProofFileFilter,
// //   limits: {
// //     fileSize: 5 * 1024 * 1024 // 5MB limit
// //   }
// // });

// // // Error handling middleware
// // const handleUploadErrors = (err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     if (err.code === 'LIMIT_FILE_SIZE') {
// //       return res.status(400).json({
// //         message: 'File too large. Please upload a smaller file.'
// //       });
// //     }
// //     if (err.code === 'LIMIT_FILE_COUNT') {
// //       return res.status(400).json({
// //         message: 'Too many files. Please upload fewer files.'
// //       });
// //     }
// //     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
// //       return res.status(400).json({
// //         message: 'Unexpected field. Please check your file upload fields.'
// //       });
// //     }
// //   } else if (err) {
// //     return res.status(400).json({
// //       message: err.message
// //     });
// //   }
// //   next();
// // };

// // const handlePaymentProofErrors = (err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     if (err.code === 'LIMIT_FILE_SIZE') {
// //       return res.status(400).json({ message: 'File size should be less than 5MB' });
// //     }
// //     return res.status(400).json({ message: err.message });
// //   } else if (err) {
// //     return res.status(400).json({ message: err.message });
// //   }
// //   next();
// // };

// // module.exports = {
// //   uploadVendorProducts,
// //   uploadProperties,
// //   uploadUserProfile,
// //   handleUploadErrors,
// //   uploadPaymentProof,
// //   handlePaymentProofErrors
// // };






