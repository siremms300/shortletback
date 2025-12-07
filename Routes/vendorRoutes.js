const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const vendorController = require("../Controllers/vendorController");
const vendorProductController = require("../Controllers/vendorProductController");
const vendorOrderController = require("../Controllers/vendorOrderController");
const { uploadVendorProducts, handleUploadErrors } = require("../middleware/uploadMiddleware");

// Vendor routes (Admin only)
router.post("/vendors", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.createVendor);
router.get("/vendors", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getAllVendors);
router.get("/vendors/stats", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getVendorStats);
router.get("/vendors/:id", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getVendorById);
router.put("/vendors/:id", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.updateVendor);
router.patch("/vendors/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.updateVendorStatus);

// Vendor product routes (Admin only)
router.post("/vendor-products", 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  uploadVendorProducts.array('images', 5), 
  handleUploadErrors,
  vendorProductController.createProduct
);

router.get("/vendor-products/vendor/:vendorId", authMiddleware.verifyToken, vendorProductController.getVendorProducts);
router.get("/vendor-products", vendorProductController.getAvailableProducts); // Public endpoint

router.put("/vendor-products/:id", 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  uploadVendorProducts.array('images', 5), 
  handleUploadErrors,
  vendorProductController.updateProduct
);

router.patch("/vendor-products/:id/availability", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorProductController.toggleProductAvailability);

// Vendor order routes
router.post("/vendor-orders", authMiddleware.verifyToken, vendorOrderController.createOrder);
router.post("/vendor-orders/:id/initialize-payment", authMiddleware.verifyToken, vendorOrderController.initializePayment);
router.post("/vendor-orders/verify-payment", authMiddleware.verifyToken, vendorOrderController.verifyPayment);
router.get("/vendor-orders/my-orders", authMiddleware.verifyToken, vendorOrderController.getUserOrders);
router.get("/vendor-orders", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorOrderController.getAllOrders);
router.patch("/vendor-orders/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorOrderController.updateOrderStatus);

module.exports = router;




























































// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/authMiddleware");
// const vendorController = require("../Controllers/vendorController");
// const vendorProductController = require("../Controllers/vendorProductController");
// const vendorOrderController = require("../Controllers/vendorOrderController");
// const upload = require("../middleware/uploadMiddleware");

// // Vendor routes (Admin only)
// router.post("/vendors", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.createVendor);
// router.get("/vendors", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getAllVendors);
// router.get("/vendors/stats", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getVendorStats);
// router.get("/vendors/:id", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.getVendorById);
// router.put("/vendors/:id", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.updateVendor);
// router.patch("/vendors/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorController.updateVendorStatus);

// // Vendor product routes (Admin only)
// router.post("/vendor-products", authMiddleware.verifyToken, authMiddleware.requireAdmin, upload.array('images', 5), vendorProductController.createProduct);
// router.get("/vendor-products/vendor/:vendorId", authMiddleware.verifyToken, vendorProductController.getVendorProducts);
// router.get("/vendor-products", vendorProductController.getAvailableProducts); // Public endpoint
// router.put("/vendor-products/:id", authMiddleware.verifyToken, authMiddleware.requireAdmin, upload.array('images', 5), vendorProductController.updateProduct);
// router.patch("/vendor-products/:id/availability", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorProductController.toggleProductAvailability);

// // Vendor order routes
// router.post("/vendor-orders", authMiddleware.verifyToken, vendorOrderController.createOrder);
// router.post("/vendor-orders/:id/initialize-payment", authMiddleware.verifyToken, vendorOrderController.initializePayment);
// router.post("/vendor-orders/verify-payment", authMiddleware.verifyToken, vendorOrderController.verifyPayment);
// router.get("/vendor-orders/my-orders", authMiddleware.verifyToken, vendorOrderController.getUserOrders);
// router.get("/vendor-orders", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorOrderController.getAllOrders);
// router.patch("/vendor-orders/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, vendorOrderController.updateOrderStatus);

// module.exports = router;