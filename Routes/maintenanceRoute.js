// Routes/maintenanceRoute.js
const express = require("express");
const router = express.Router();
const maintenanceController = require("../Controllers/maintenanceController");
const maintenanceVendorController = require("../Controllers/maintenanceVendorController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Maintenance issue routes
router.get("/issues", maintenanceController.getAllIssues);
router.get("/issues/:id", maintenanceController.getIssueById);
router.post("/issues", maintenanceController.createIssue);
router.put("/issues/:id", maintenanceController.updateIssue);
router.delete("/issues/:id", maintenanceController.deleteIssue);
router.patch("/issues/:id/status", maintenanceController.updateIssueStatus);

// Maintenance vendor routes
router.get("/vendors", maintenanceVendorController.getAllVendors);
router.get("/vendors/:id", maintenanceVendorController.getVendorById);
router.post("/vendors", maintenanceVendorController.createVendor);
router.put("/vendors/:id", maintenanceVendorController.updateVendor);
router.delete("/vendors/:id", maintenanceVendorController.deleteVendor);

// Statistics routes
router.get("/stats", maintenanceController.getMaintenanceStats);
router.get("/vendors/stats", maintenanceVendorController.getVendorStats);

module.exports = router;