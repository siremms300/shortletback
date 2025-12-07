const router = require("express").Router();
const bookingController = require("../Controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadPaymentProof } = require("../middleware/uploadMiddleware");  

// Public routes
router.get("/property/:propertyId/availability", bookingController.checkAvailability);

router.post(
  "/:id/upload-proof",
  authMiddleware.verifyToken,
  uploadPaymentProof.single('proof'),
  bookingController.uploadProofOfPayment
);

router.patch(
  "/admin/:id/verify-transfer",
  authMiddleware.verifyToken,
  authMiddleware.requireAdmin,
  bookingController.verifyBankTransfer
);

router.patch(
  "/admin/:id/mark-onsite-collected",
  authMiddleware.verifyToken,
  authMiddleware.requireAdmin,
  bookingController.markOnsitePaymentCollected
);

// Protected routes (require authentication)
router.post("/", authMiddleware.verifyToken, bookingController.createBooking);
router.get("/my-bookings", authMiddleware.verifyToken, bookingController.getUserBookings);
router.get("/:id", authMiddleware.verifyToken, bookingController.getBookingById);
router.patch("/:id/cancel", authMiddleware.verifyToken, bookingController.cancelBooking);

// Payment routes
router.post("/:id/initialize-payment", authMiddleware.verifyToken, bookingController.initializePayment); 
// router.post("/:id/retry-payment", authMiddleware.verifyToken, bookingController.retryPayment);
router.post("/verify-payment", authMiddleware.verifyToken, bookingController.verifyPayment);

// Admin routes
router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.getAllBookings);
router.patch("/admin/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.updateBookingStatus);

module.exports = router;



