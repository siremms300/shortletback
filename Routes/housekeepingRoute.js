// Routes/housekeepingRoute.js
const express = require("express");
const router = express.Router();
const housekeepingController = require("../Controllers/housekeepingController");
const authMiddleware = require("../middleware/authMiddleware");

// User routes
router.post("/requests", authMiddleware.verifyToken, housekeepingController.createRequest);
router.get("/requests", authMiddleware.verifyToken, housekeepingController.getUserRequests);
router.get("/requests/:id", authMiddleware.verifyToken, housekeepingController.getRequestById);
router.put("/requests/:id", authMiddleware.verifyToken, housekeepingController.updateRequest);
router.patch("/requests/:id/cancel", authMiddleware.verifyToken, housekeepingController.cancelRequest);

// Admin routes
router.get("/admin/requests", authMiddleware.verifyToken, authMiddleware.requireAdmin, housekeepingController.getAllRequests);
router.patch("/admin/requests/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, housekeepingController.updateRequestStatus);
router.get("/admin/stats", authMiddleware.verifyToken, authMiddleware.requireAdmin, housekeepingController.getHousekeepingStats);

module.exports = router;