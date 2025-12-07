// Controllers/inventoryController.js
const InventoryItem = require("../Models/InventoryModel");

const inventoryController = {
  // Get all inventory items
  getAllItems: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        category,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Build filter query
      if (category && category !== 'all') query.category = category;
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { itemNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const items = await InventoryItem.find(query)
        .populate('createdBy', 'firstName lastName')
        .populate('stockMovements.performedBy', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await InventoryItem.countDocuments(query);

      res.status(200).json({
        items,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get inventory items error:', error);
      res.status(500).json({
        message: "Failed to fetch inventory items",
        error: error.message
      });
    }
  },

  // Get inventory item by ID
  getItemById: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await InventoryItem.findById(id)
        .populate('createdBy', 'firstName lastName')
        .populate('stockMovements.performedBy', 'firstName lastName');

      if (!item) {
        return res.status(404).json({
          message: "Inventory item not found"
        });
      }

      res.status(200).json({
        item
      });

    } catch (error) {
      console.error('Get inventory item error:', error);
      res.status(500).json({
        message: "Failed to fetch inventory item",
        error: error.message
      });
    }
  },

  // Create new inventory item
  createItem: async (req, res) => {
    try {
      const {
        name,
        category,
        description,
        currentStock,
        minStock,
        reorderLevel,
        unit,
        location,
        supplier,
        cost,
        barcode,
        notes
      } = req.body;

      // Validate required fields
      if (!name || !category || !unit || !location) {
        return res.status(400).json({
          message: "Name, category, unit, and location are required"
        });
      }

      // Create inventory item
      const item = new InventoryItem({
        name,
        category,
        description: description || '',
        currentStock: currentStock || 0,
        minStock: minStock || 0,
        reorderLevel: reorderLevel || 0,
        unit,
        location,
        supplier: supplier || '',
        cost: cost || 0,
        barcode: barcode || '',
        notes: notes || '',
        createdBy: req.user.id
      });

      // Update stock status based on current stock
      item.updateStockStatus();

      await item.save();

      const populatedItem = await InventoryItem.findById(item._id)
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Inventory item created successfully",
        item: populatedItem
      });

    } catch (error) {
      console.error('Create inventory item error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to create inventory item",
        error: error.message
      });
    }
  },

  // Update inventory item
  updateItem: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const item = await InventoryItem.findById(id);

      if (!item) {
        return res.status(404).json({
          message: "Inventory item not found"
        });
      }

      // Update item
      const updatedItem = await InventoryItem.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      // Update stock status if stock was modified
      if (updateData.currentStock !== undefined) {
        updatedItem.updateStockStatus();
        await updatedItem.save();
      }

      res.status(200).json({
        message: "Inventory item updated successfully",
        item: updatedItem
      });

    } catch (error) {
      console.error('Update inventory item error:', error);
      res.status(500).json({
        message: "Failed to update inventory item",
        error: error.message
      });
    }
  },

  // Delete inventory item
  deleteItem: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await InventoryItem.findById(id);

      if (!item) {
        return res.status(404).json({
          message: "Inventory item not found"
        });
      }

      await InventoryItem.findByIdAndDelete(id);

      res.status(200).json({
        message: "Inventory item deleted successfully"
      });

    } catch (error) {
      console.error('Delete inventory item error:', error);
      res.status(500).json({
        message: "Failed to delete inventory item",
        error: error.message
      });
    }
  },

  // Update stock level
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { type, quantity, reason } = req.body;

      if (!type || !quantity || !reason) {
        return res.status(400).json({
          message: "Type, quantity, and reason are required"
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0"
        });
      }

      const item = await InventoryItem.findById(id);

      if (!item) {
        return res.status(404).json({
          message: "Inventory item not found"
        });
      }

      const previousStock = item.currentStock;
      let newStock;

      // Calculate new stock based on transaction type
      switch (type) {
        case 'in':
          newStock = previousStock + quantity;
          break;
        case 'out':
          if (previousStock < quantity) {
            return res.status(400).json({
              message: "Insufficient stock for this transaction"
            });
          }
          newStock = previousStock - quantity;
          break;
        case 'adjustment':
          newStock = quantity;
          break;
        default:
          return res.status(400).json({
            message: "Invalid transaction type"
          });
      }

      // Update stock and status
      item.currentStock = newStock;
      item.updateStockStatus();

      // Add stock movement record
      item.addStockMovement({
        type,
        quantity,
        reason,
        performedBy: req.user.id
      });

      // Update last restocked date for stock in transactions
      if (type === 'in') {
        item.lastRestocked = new Date();
      }

      await item.save();

      const populatedItem = await InventoryItem.findById(item._id)
        .populate('createdBy', 'firstName lastName')
        .populate('stockMovements.performedBy', 'firstName lastName');

      res.status(200).json({
        message: "Stock updated successfully",
        item: populatedItem
      });

    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({
        message: "Failed to update stock",
        error: error.message
      });
    }
  },

  // Get inventory statistics
  getInventoryStats: async (req, res) => {
    try {
      const totalItems = await InventoryItem.countDocuments();
      const inStockItems = await InventoryItem.countDocuments({ status: 'in-stock' });
      const lowStockItems = await InventoryItem.countDocuments({ status: 'low-stock' });
      const outOfStockItems = await InventoryItem.countDocuments({ status: 'out-of-stock' });

      // Calculate total inventory value
      const valueResult = await InventoryItem.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } }
          }
        }
      ]);

      const totalValue = valueResult[0]?.totalValue || 0;

      // Get items needing reorder
      const reorderItems = await InventoryItem.find({
        $or: [
          { status: 'low-stock' },
          { status: 'out-of-stock' }
        ]
      }).select('name itemNumber currentStock minStock status');

      // Category breakdown
      const categoryStats = await InventoryItem.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } }
          }
        }
      ]);

      res.status(200).json({
        stats: {
          totalItems,
          inStockItems,
          lowStockItems,
          outOfStockItems,
          totalValue,
          reorderItems,
          categoryStats
        }
      });

    } catch (error) {
      console.error('Get inventory stats error:', error);
      res.status(500).json({
        message: "Failed to fetch inventory statistics",
        error: error.message
      });
    }
  },

  // Get stock movements for an item
  getStockMovements: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await InventoryItem.findById(id)
        .populate('stockMovements.performedBy', 'firstName lastName')
        .select('stockMovements name itemNumber');

      if (!item) {
        return res.status(404).json({
          message: "Inventory item not found"
        });
      }

      res.status(200).json({
        movements: item.stockMovements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

    } catch (error) {
      console.error('Get stock movements error:', error);
      res.status(500).json({
        message: "Failed to fetch stock movements",
        error: error.message
      });
    }
  }
};

module.exports = inventoryController;