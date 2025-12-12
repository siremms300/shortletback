const express = require("express");
const router = express.Router();
const propertyController = require("../Controllers/propertyController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadProperties, handleUploadErrors } = require("../middleware/uploadMiddleware");
const { createUploadHandler } = require("../middleware/uploadHandler"); // Add this
const validateObjectId = require("../middleware/validateObjectId");

// Public routes
router.get("/", propertyController.getAllProperties);
router.get("/featured", propertyController.getFeaturedProperties);
router.get("/:id", validateObjectId('id'), propertyController.getPropertyById);

// Updated protected routes with Vercel handler
router.post("/", 
  authMiddleware.verifyToken, 
  createUploadHandler(uploadProperties.array('images', 10)), // Updated
  handleUploadErrors,
  propertyController.createProperty
);

router.put("/:id", 
  authMiddleware.verifyToken, 
  validateObjectId('id'),
  createUploadHandler(uploadProperties.array('images', 10)), // Updated
  handleUploadErrors,
  propertyController.updateProperty
);

// ... rest of your routes remain the same
router.delete("/:id", 
  authMiddleware.verifyToken, 
  validateObjectId('id'),
  propertyController.deleteProperty
);

// User's properties
router.get("/user/my-properties", authMiddleware.verifyToken, propertyController.getUserProperties);

// Admin only routes
router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, propertyController.getAllPropertiesAdmin);
router.patch("/admin/:id/status", 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  validateObjectId('id'),
  propertyController.updatePropertyStatus
);
router.patch("/admin/:id/feature", 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  validateObjectId('id'),
  propertyController.toggleFeatured
);

module.exports = router;






























































































// // Routes/propertyRoute.js
// const express = require("express");
// const router = express.Router();
// const propertyController = require("../Controllers/propertyController");
// const authMiddleware = require("../middleware/authMiddleware");
// const { uploadProperties, handleUploadErrors } = require("../middleware/uploadMiddleware");
// const validateObjectId = require("../middleware/validateObjectId"); // Add this

// // Public routes
// router.get("/", propertyController.getAllProperties);
// router.get("/featured", propertyController.getFeaturedProperties);
// router.get("/:id", validateObjectId('id'), propertyController.getPropertyById); // Add validation

// // Protected routes
// router.post("/", 
//   authMiddleware.verifyToken, 
//   uploadProperties.array('images', 10), 
//   handleUploadErrors,
//   propertyController.createProperty
// );

// router.put("/:id", 
//   authMiddleware.verifyToken, 
//   validateObjectId('id'), // Add validation
//   uploadProperties.array('images', 10), 
//   handleUploadErrors,
//   propertyController.updateProperty
// );

// router.delete("/:id", 
//   authMiddleware.verifyToken, 
//   validateObjectId('id'), // Add validation
//   propertyController.deleteProperty
// );

// // User's properties
// router.get("/user/my-properties", authMiddleware.verifyToken, propertyController.getUserProperties);

// // Admin only routes
// router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, propertyController.getAllPropertiesAdmin);
// router.patch("/admin/:id/status", 
//   authMiddleware.verifyToken, 
//   authMiddleware.requireAdmin, 
//   validateObjectId('id'), // Add validation
//   propertyController.updatePropertyStatus
// );
// router.patch("/admin/:id/feature", 
//   authMiddleware.verifyToken, 
//   authMiddleware.requireAdmin, 
//   validateObjectId('id'), // Add validation
//   propertyController.toggleFeatured
// );

// module.exports = router;










































// // const express = require("express");
// // const router = express.Router();
// // const propertyController = require("../Controllers/propertyController");
// // const authMiddleware = require("../middleware/authMiddleware");
// // const { uploadProperties, handleUploadErrors } = require("../middleware/uploadMiddleware");

// // // Update the create property route
// // router.post("/", 
// //   authMiddleware.verifyToken, 
// //   uploadProperties.array('images', 10), 
// //   handleUploadErrors,
// //   propertyController.createProperty
// // );

// // // Update the update property route
// // router.put("/:id", 
// //   authMiddleware.verifyToken, 
// //   uploadProperties.array('images', 10), 
// //   handleUploadErrors,
// //   propertyController.updateProperty
// // );
 










// // // const router = require("express").Router();
// // // const multer = require("multer");
// // // const propertyController = require("../Controllers/propertyController");
// // // const authMiddleware = require("../middleware/authMiddleware");

// // // // Configure multer for file uploads
// // // const storage = multer.diskStorage({
// // //   destination: function (req, file, cb) {
// // //     cb(null, "public/uploads/properties/");
// // //   },
// // //   filename: function (req, file, cb) {
// // //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// // //     cb(null, uniqueSuffix + '-' + file.originalname);
// // //   },
// // // });

// // // const upload = multer({ 
// // //   storage,
// // //   limits: {
// // //     fileSize: 5 * 1024 * 1024, // 5MB limit
// // //   },
// // //   fileFilter: (req, file, cb) => {
// // //     if (file.mimetype.startsWith('image/')) {
// // //       cb(null, true);
// // //     } else {
// // //       cb(new Error('Only image files are allowed!'), false);
// // //     }
// // //   }
// // // });

// // // Public routes
// // router.get("/", propertyController.getAllProperties);
// // router.get("/featured", propertyController.getFeaturedProperties);
// // router.get("/:id", propertyController.getPropertyById);

// // // Protected routes (require authentication)
// // // router.post("/", authMiddleware.verifyToken, upload.array('images', 10), propertyController.createProperty);
// // // router.put("/:id", authMiddleware.verifyToken, upload.array('images', 10), propertyController.updateProperty);
// // router.delete("/:id", authMiddleware.verifyToken, propertyController.deleteProperty);

// // // Admin only routes
// // router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, propertyController.getAllPropertiesAdmin);
// // router.patch("/admin/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, propertyController.updatePropertyStatus);
// // router.patch("/admin/:id/feature", authMiddleware.verifyToken, authMiddleware.requireAdmin, propertyController.toggleFeatured);

// // // User's properties
// // router.get("/user/my-properties", authMiddleware.verifyToken, propertyController.getUserProperties);

// // module.exports = router;



