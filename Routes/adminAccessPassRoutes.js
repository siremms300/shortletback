// routes/adminAccessPassRoutes.js
const router = require("express").Router();
const adminAccessPassController = require("../Controllers/adminAccessPassController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require admin authentication
router.use(authMiddleware.verifyToken, authMiddleware.requireAdmin);

// Send access pass to user
router.post("/bookings/:bookingId/send-access-pass", adminAccessPassController.sendAccessPass);

// Update access pass
router.put("/bookings/:bookingId/access-pass", adminAccessPassController.updateAccessPass);

// Get access pass information
router.get("/bookings/:bookingId/access-pass", adminAccessPassController.getAccessPassInfo);

module.exports = router;