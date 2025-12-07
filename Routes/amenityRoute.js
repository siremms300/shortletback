const router = require("express").Router();
const amenityController = require("../Controllers/amenityController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.get("/", amenityController.getAllAmenities);
router.get("/categories", amenityController.getAmenityCategories);
router.get("/:id", amenityController.getAmenityById);

// Protected routes (require authentication)
router.post("/", authMiddleware.verifyToken, amenityController.createAmenity);
router.put("/:id", authMiddleware.verifyToken, amenityController.updateAmenity);
router.delete("/:id", authMiddleware.verifyToken, amenityController.deleteAmenity);

// Admin only routes
router.post("/bulk", authMiddleware.verifyToken, authMiddleware.requireAdmin, amenityController.bulkCreateAmenities);
router.delete("/admin/:id/hard", authMiddleware.verifyToken, authMiddleware.requireAdmin, amenityController.hardDeleteAmenity);

module.exports = router;

