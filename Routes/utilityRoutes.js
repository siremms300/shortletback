const express = require("express");
const router = express.Router();
const utilityController = require("../Controllers/utilityController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ========== READING ROUTES ==========
router.post("/readings", utilityController.createReading);
router.get("/readings", utilityController.getAllReadings);
router.get("/readings/export", utilityController.exportReadings);
router.get("/readings/:id", utilityController.getReadingById);
router.put("/readings/:id", utilityController.updateReading);
router.delete("/readings/:id", utilityController.deleteReading);
router.patch("/readings/:id/billed", utilityController.markAsBilled);
router.post("/readings/bulk", utilityController.bulkUpload);

// ========== RATE ROUTES ==========
router.get("/rates", utilityController.getAllRates);
router.put("/rates/:type", utilityController.updateRate);

// ========== ALERT ROUTES ==========
router.get("/alerts", utilityController.getAllAlerts);
router.patch("/alerts/:id/resolve", utilityController.resolveAlert);

// ========== STATS ROUTES ==========
router.get("/stats", utilityController.getStats);

module.exports = router;
















































// const express = require("express");
// const router = express.Router();
// const utilityController = require("../Controllers/utilityController");
// const authMiddleware = require("../middleware/authMiddleware");

// // All routes require authentication
// router.use(authMiddleware.verifyToken);

// // ========== READING ROUTES ==========
// router.post("/readings", utilityController.createReading);
// router.get("/readings", utilityController.getAllReadings);
// router.get("/readings/export", utilityController.exportReadings);
// router.get("/readings/:id", utilityController.getReadingById);
// router.put("/readings/:id", utilityController.updateReading);
// router.delete("/readings/:id", utilityController.deleteReading);
// router.patch("/readings/:id/billed", utilityController.markAsBilled);
// router.post("/readings/bulk", utilityController.bulkUpload);

// // ========== RATE ROUTES ==========
// router.get("/rates", utilityController.getAllRates);
// router.put("/rates/:type", utilityController.updateRate);

// // ========== ALERT ROUTES ==========
// router.get("/alerts", utilityController.getAllAlerts);
// router.patch("/alerts/:id/resolve", utilityController.resolveAlert);

// // ========== STATS ROUTES ==========
// router.get("/stats", utilityController.getStats);

// module.exports = router;