// Routes/affiliateRoutes.js
const express = require("express");
const router = express.Router();
const affiliateController = require("../Controllers/affiliateController");
const authMiddleware = require("../middleware/authMiddleware");

// ========== PUBLIC ROUTES ==========
// Validate affiliate code (no auth required for checkout)
router.get("/validate/:code", affiliateController.validateAffiliateCode);

// ========== PROTECTED ROUTES (Require Authentication) ==========
router.use(authMiddleware.verifyToken);

// Apply affiliate code to booking
router.post("/bookings/:bookingId/apply", affiliateController.applyAffiliateCode);

// ========== ADMIN ONLY ROUTES ==========

// Affiliate management
router.post("/", authMiddleware.requireAdmin, affiliateController.createAffiliate);
router.get("/", authMiddleware.requireAdmin, affiliateController.getAllAffiliates);
router.get("/summary", authMiddleware.requireAdmin, affiliateController.getAffiliatesSummary);
router.get("/:id", authMiddleware.requireAdmin, affiliateController.getAffiliateById);
router.put("/:id", authMiddleware.requireAdmin, affiliateController.updateAffiliate);
router.patch("/:id/status", authMiddleware.requireAdmin, affiliateController.updateAffiliateStatus);
router.delete("/:id", authMiddleware.requireAdmin, affiliateController.deleteAffiliate);

// Affiliate bookings
router.get("/:affiliateId/bookings", authMiddleware.requireAdmin, affiliateController.getAffiliateBookings);

// Commission management
router.patch("/commissions/:id/status", authMiddleware.requireAdmin, affiliateController.updateCommissionStatus);

// Affiliate stats
router.get("/:id/stats", authMiddleware.requireAdmin, affiliateController.getAffiliateStats);

module.exports = router;