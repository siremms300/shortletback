const express = require("express");
const router = express.Router();
const userController = require("../Controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadUserProfile, handleUploadErrors } = require("../middleware/uploadMiddleware");
const { createUploadHandler } = require("../middleware/uploadHandler"); // Add this

// Update profile update route with Vercel handler
router.put("/:userId", 
  authMiddleware.verifyToken, 
  createUploadHandler(uploadUserProfile.single('profileImage')), // Updated
  handleUploadErrors,
  userController.updateProfile
);

// Update document upload route with Vercel handler
router.post("/:userId/documents", 
  authMiddleware.verifyToken, 
  createUploadHandler(uploadUserProfile.single('documentFile')), // Updated
  handleUploadErrors,
  userController.uploadDocument
);

// Email test route
router.get('/test-email', async (req, res) => {
  try {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'siremms300@gmail.com',
      _id: '123456789'
    };

    // Test email configuration
    const configOk = await emailService.testEmailConfig();
    if (!configOk) {
      return res.status(500).json({ message: 'Email configuration failed' });
    }

    // Test welcome email
    await emailService.sendWelcomeEmail(testUser);
    
    // Test document notification
    await emailService.sendDocumentUploadNotification(testUser, 'passport');

    res.json({ message: 'Test emails sent successfully' });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ message: 'Email test failed', error: error.message });
  }
});

// ... rest of your routes remain the same
/* GET USER DOCUMENTS */
router.get("/:userId/documents", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, userController.getDocuments);

/* GET USER PROFILE */
router.get("/:userId", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, userController.getProfile);

// ===== ADMIN ROUTES =====
router.get("/", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getAllUsers);
router.get("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getUserById);
router.put("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.updateUser);
router.delete("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.deleteUser);
router.patch("/admin/:userId/verify", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyUser);
router.patch("/admin/:userId/suspend", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.suspendUser);
router.patch("/admin/:userId/activate", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.activateUser);
router.patch("/admin/documents/:documentId/verify", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyDocument);
router.patch("/admin/documents/:documentId/reject", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.rejectDocument);
router.patch("/admin/documents/:documentId/approve", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyDocument);

module.exports = router;















































































// const express = require("express");
// const router = express.Router();
// const userController = require("../Controllers/userController");
// const authMiddleware = require("../middleware/authMiddleware");
// const { uploadUserProfile, handleUploadErrors } = require("../middleware/uploadMiddleware");

// // Update profile update route
// router.put("/:userId", 
//   authMiddleware.verifyToken, 
//   uploadUserProfile.single('profileImage'), 
//   handleUploadErrors,
//   userController.updateProfile
// );

// // Update document upload route
// router.post("/:userId/documents", 
//   authMiddleware.verifyToken, 
//   uploadUserProfile.single('documentFile'), 
//   handleUploadErrors,
//   userController.uploadDocument
// );
 
   

// // // routes/user.js
// // const router = require("express").Router();
// // const multer = require("multer");
// // const userController = require("../Controllers/userController");
// // const authMiddleware = require("../middleware/authMiddleware");

// // /* Configuration Multer for File Upload */
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, "public/uploads/");
// //   },
// //   filename: function (req, file, cb) {
// //     cb(null, Date.now() + "-" + file.originalname);
// //   },
// // });

// // const upload = multer({ 
// //   storage,
// //   limits: {
// //     fileSize: 5 * 1024 * 1024, // 5MB limit
// //   }
// // });
 

// router.get('/test-email', async (req, res) => {
//   try {
//     const testUser = {
//       firstName: 'Test',
//       lastName: 'User',
//       email: 'siremms300@gmail.com',
//       _id: '123456789'
//     };

//     // Test email configuration
//     const configOk = await emailService.testEmailConfig();
//     if (!configOk) {
//       return res.status(500).json({ message: 'Email configuration failed' });
//     }

//     // Test welcome email
//     await emailService.sendWelcomeEmail(testUser);
    
//     // Test document notification
//     await emailService.sendDocumentUploadNotification(testUser, 'passport');

//     res.json({ message: 'Test emails sent successfully' });
//   } catch (error) {
//     console.error('Email test error:', error);
//     res.status(500).json({ message: 'Email test failed', error: error.message });
//   }
// });


// // ===== USER ROUTES (User can access their own data) =====
// /* UPLOAD DOCUMENT */
// // router.post("/:userId/documents", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, upload.single("document"), userController.uploadDocument);

// /* GET USER DOCUMENTS */
// router.get("/:userId/documents", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, userController.getDocuments);

// /* UPDATE USER PROFILE */
// // router.put("/:userId", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, upload.single("profileImage"), userController.updateProfile);

// /* GET USER PROFILE */
// router.get("/:userId", authMiddleware.verifyToken, authMiddleware.requireOwnerOrAdmin, userController.getProfile);

// // ===== ADMIN ROUTES (Admin only) =====
// /* GET ALL USERS (Admin only) */
// router.get("/", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getAllUsers);

// /* GET USER BY ID (Admin only) */
// router.get("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.getUserById);

// /* UPDATE USER (Admin only) */
// router.put("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.updateUser);

// /* DELETE USER (Admin only) */
// router.delete("/admin/:userId", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.deleteUser);

// /* VERIFY USER (Admin only) */
// router.patch("/admin/:userId/verify", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyUser);

// /* SUSPEND USER (Admin only) */
// router.patch("/admin/:userId/suspend", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.suspendUser);

// /* ACTIVATE USER (Admin only) */
// router.patch("/admin/:userId/activate", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.activateUser);

// /* VERIFY DOCUMENT (Admin only) */
// router.patch("/admin/documents/:documentId/verify", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyDocument);

// /* REJECT DOCUMENT (Admin only) */
// router.patch("/admin/documents/:documentId/reject", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.rejectDocument);

// /* APPROVE DOCUMENT (Admin only) */
// router.patch("/admin/documents/:documentId/approve", authMiddleware.verifyToken, authMiddleware.requireAdmin, userController.verifyDocument);
// module.exports = router;







 





















// // // routes/user.js
// // const router = require("express").Router();
// // const multer = require("multer");
// // const userController = require("../Controllers/userController");

// // /* Configuration Multer for File Upload */
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, "public/uploads/documents/");
// //   },
// //   filename: function (req, file, cb) {
// //     cb(null, Date.now() + "-" + file.originalname);
// //   },
// // });

// // const upload = multer({ storage });

// // /* UPLOAD DOCUMENT */
// // router.post("/:userId/documents", upload.single("document"), userController.uploadDocument);

// // /* GET USER PROFILE */
// // router.get("/:userId", userController.getProfile);

// // /* UPDATE USER PROFILE */
// // router.put("/:userId", upload.single("profileImage"), userController.updateProfile);

// // module.exports = router;