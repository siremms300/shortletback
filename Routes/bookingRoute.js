// Routes/bookingRoutes
const router = require("express").Router();
const bookingController = require("../Controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadPaymentProof } = require("../middleware/uploadMiddleware");  
const { createUploadHandler } = require("../middleware/uploadHandler"); // Add this

// Public routes
router.get("/property/:propertyId/availability", bookingController.checkAvailability);

// Updated upload proof route
router.post(
  "/:id/upload-proof",
  authMiddleware.verifyToken,
  createUploadHandler(uploadPaymentProof.single('proof')), // Updated
  bookingController.uploadProofOfPayment
);

// ... rest of your routes remain the same
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
router.post("/verify-payment", authMiddleware.verifyToken, bookingController.verifyPayment);

// Admin routes
router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.getAllBookings);
router.patch("/admin/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.updateBookingStatus);


// Add this to your booking routes for testing
router.post('/test-amount-conversion', (req, res) => {
  try {
    const { nairaAmount } = req.body;
    
    if (!nairaAmount) {
      return res.status(400).json({ error: 'nairaAmount is required' });
    }
    
    const naira = parseFloat(nairaAmount);
    const kobo = Math.round(naira * 100);
    
    res.json({
      input: {
        nairaAmount: naira,
        stringValue: nairaAmount.toString()
      },
      conversion: {
        formula: `${naira} × 100 = ${kobo}`,
        kobo: kobo,
        isInteger: Number.isInteger(kobo)
      },
      examples: {
        '₦1': '1 × 100 = 100 kobo',
        '₦1000': '1000 × 100 = 100000 kobo',
        '₦157,875': '157875 × 100 = 15787500 kobo'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;






























































































// const router = require("express").Router();
// const bookingController = require("../Controllers/bookingController");
// const authMiddleware = require("../middleware/authMiddleware");
// const { uploadPaymentProof } = require("../middleware/uploadMiddleware");  

// // Public routes
// router.get("/property/:propertyId/availability", bookingController.checkAvailability);

// router.post(
//   "/:id/upload-proof",
//   authMiddleware.verifyToken,
//   uploadPaymentProof.single('proof'),
//   bookingController.uploadProofOfPayment
// );

// router.patch(
//   "/admin/:id/verify-transfer",
//   authMiddleware.verifyToken,
//   authMiddleware.requireAdmin,
//   bookingController.verifyBankTransfer
// );

// router.patch(
//   "/admin/:id/mark-onsite-collected",
//   authMiddleware.verifyToken,
//   authMiddleware.requireAdmin,
//   bookingController.markOnsitePaymentCollected
// );

// // Protected routes (require authentication)
// router.post("/", authMiddleware.verifyToken, bookingController.createBooking);
// router.get("/my-bookings", authMiddleware.verifyToken, bookingController.getUserBookings);
// router.get("/:id", authMiddleware.verifyToken, bookingController.getBookingById);
// router.patch("/:id/cancel", authMiddleware.verifyToken, bookingController.cancelBooking);

// // Payment routes
// router.post("/:id/initialize-payment", authMiddleware.verifyToken, bookingController.initializePayment); 
// // router.post("/:id/retry-payment", authMiddleware.verifyToken, bookingController.retryPayment);
// router.post("/verify-payment", authMiddleware.verifyToken, bookingController.verifyPayment);

// // Admin routes
// router.get("/admin/all", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.getAllBookings);
// router.patch("/admin/:id/status", authMiddleware.verifyToken, authMiddleware.requireAdmin, bookingController.updateBookingStatus);

// module.exports = router;



