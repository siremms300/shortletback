const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'public/uploads/vendor-products',
    'public/uploads/properties',
    'public/uploads/users'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for vendor products
const vendorProductStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/vendor-products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vendor-product-' + uniqueSuffix + path.extname(file.originalname));
  }
});



// Configure storage for properties
const propertyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/properties/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});



// Configure storage for user profiles
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/users/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};



// Configure storage for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for payment proofs
const paymentProofFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  }
};

// Create multer instances
const uploadVendorProducts = multer({
  storage: vendorProductStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const uploadProperties = multer({
  storage: propertyStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const uploadUserProfile = multer({
  storage: userStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  }
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Please upload a smaller file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Please upload fewer files.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field. Please check your file upload fields.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

const handlePaymentProofErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size should be less than 5MB' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadVendorProducts,
  uploadProperties,
  uploadUserProfile,
  handleUploadErrors,
  uploadPaymentProof,
  handlePaymentProofErrors
};






