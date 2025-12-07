const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const { uploadUserProfile, handleUploadErrors } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// Update register route
router.post("/register", 
  uploadUserProfile.single('profileImage'), 
  handleUploadErrors,
  authController.register
);
 
  
// // routes/auth.js
// const router = require("express").Router();
// const multer = require("multer");
// const authController = require("../Controllers/authController");
// const authMiddleware = require("../middleware/authMiddleware");

// /* Configuration Multer for File Upload */
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage });

/* USER REGISTER */
// router.post("/register", upload.single("profileImage"), authController.register);

/* USER LOGIN */
router.post("/login", authController.login);

/* REFRESH TOKEN */
router.post("/refresh-token", authController.refreshToken);

/* LOGOUT */
router.post("/logout", authController.logout);

/* LOGOUT ALL DEVICES (Protected) */
router.post("/logout-all", authMiddleware.verifyToken, authController.logoutAll);

/* FORGOT PASSWORD */
router.post("/forgot-password", authController.forgotPassword);

/* RESET PASSWORD */
router.post("/reset-password", authController.resetPassword);

module.exports = router;

 