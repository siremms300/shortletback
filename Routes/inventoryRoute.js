// Routes/inventoryRoute.js
const express = require("express");
const router = express.Router();
const inventoryController = require("../Controllers/inventoryController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Inventory item routes
router.get("/items", inventoryController.getAllItems);
router.get("/items/:id", inventoryController.getItemById);
router.post("/items", inventoryController.createItem);
router.put("/items/:id", inventoryController.updateItem);
router.delete("/items/:id", inventoryController.deleteItem);

// Stock management routes
router.patch("/items/:id/stock", inventoryController.updateStock);
router.get("/items/:id/movements", inventoryController.getStockMovements);

// Statistics route
router.get("/stats", inventoryController.getInventoryStats);

module.exports = router;