// Models/InventoryModel.js
const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const inventoryItemSchema = new mongoose.Schema({
  itemNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TEMP-${Date.now()}`; // Temporary default
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['linen', 'toiletries', 'kitchen', 'cleaning', 'amenities', 'furniture', 'electronics'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  supplier: {
    type: String,
    default: ''
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  barcode: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'on-order'],
    default: 'in-stock'
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  stockMovements: [stockMovementSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Fixed pre-save middleware to generate item number
inventoryItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const InventoryItem = mongoose.model('InventoryItem');
      const lastItem = await InventoryItem.findOne().sort({ itemNumber: -1 });
      
      let nextNumber = 1;
      if (lastItem && lastItem.itemNumber) {
        const lastNumber = parseInt(lastItem.itemNumber.split('-')[1]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      this.itemNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating item number:', error);
      // Fallback: use timestamp
      this.itemNumber = `INV-${Date.now()}`;
    }
  }
  next();
});

// Virtual for stock value
inventoryItemSchema.virtual('stockValue').get(function() {
  return this.currentStock * this.cost;
});

// Method to update stock status
inventoryItemSchema.methods.updateStockStatus = function() {
  if (this.currentStock === 0) {
    this.status = 'out-of-stock';
  } else if (this.currentStock <= this.minStock) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
};

// Method to add stock movement
inventoryItemSchema.methods.addStockMovement = function(movementData) {
  this.stockMovements.push({
    ...movementData,
    previousStock: this.currentStock,
    newStock: movementData.type === 'adjustment' 
      ? movementData.quantity 
      : movementData.type === 'in' 
        ? this.currentStock + movementData.quantity 
        : this.currentStock - movementData.quantity
  });
};

// Indexes for better performance
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ location: 1 });
inventoryItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);

































































// // Models/InventoryModel.js
// const mongoose = require("mongoose");

// const stockMovementSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['in', 'out', 'adjustment'],
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   reason: {
//     type: String,
//     required: true
//   },
//   performedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   previousStock: {
//     type: Number,
//     required: true
//   },
//   newStock: {
//     type: Number,
//     required: true
//   }
// }, { timestamps: true });

// const inventoryItemSchema = new mongoose.Schema({
//   itemNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     enum: ['linen', 'toiletries', 'kitchen', 'cleaning', 'amenities', 'furniture', 'electronics'],
//     required: true
//   },
//   description: {
//     type: String,
//     default: ''
//   },
//   currentStock: {
//     type: Number,
//     required: true,
//     min: 0,
//     default: 0
//   },
//   minStock: {
//     type: Number,
//     required: true,
//     min: 0,
//     default: 0
//   },
//   reorderLevel: {
//     type: Number,
//     required: true,
//     min: 0,
//     default: 0
//   },
//   unit: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   location: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   supplier: {
//     type: String,
//     default: ''
//   },
//   cost: {
//     type: Number,
//     required: true,
//     min: 0,
//     default: 0
//   },
//   barcode: {
//     type: String,
//     default: ''
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   status: {
//     type: String,
//     enum: ['in-stock', 'low-stock', 'out-of-stock', 'on-order'],
//     default: 'in-stock'
//   },
//   lastRestocked: {
//     type: Date,
//     default: Date.now
//   },
//   stockMovements: [stockMovementSchema],
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, { 
//   timestamps: true 
// });

// // Pre-save middleware to generate item number
// inventoryItemSchema.pre('save', async function(next) {
//   if (this.isNew && !this.itemNumber) {
//     try {
//       const InventoryItem = mongoose.model('InventoryItem');
//       const count = await InventoryItem.countDocuments();
//       this.itemNumber = `INV-${(count + 1).toString().padStart(4, '0')}`;
//     } catch (error) {
//       this.itemNumber = `INV-${Date.now()}`;
//     }
//   }
//   next();
// });

// // Virtual for stock value
// inventoryItemSchema.virtual('stockValue').get(function() {
//   return this.currentStock * this.cost;
// });

// // Method to update stock status
// inventoryItemSchema.methods.updateStockStatus = function() {
//   if (this.currentStock === 0) {
//     this.status = 'out-of-stock';
//   } else if (this.currentStock <= this.minStock) {
//     this.status = 'low-stock';
//   } else {
//     this.status = 'in-stock';
//   }
// };

// // Method to add stock movement
// inventoryItemSchema.methods.addStockMovement = function(movementData) {
//   this.stockMovements.push({
//     ...movementData,
//     previousStock: this.currentStock,
//     newStock: movementData.type === 'adjustment' 
//       ? movementData.quantity 
//       : movementData.type === 'in' 
//         ? this.currentStock + movementData.quantity 
//         : this.currentStock - movementData.quantity
//   });
// };

// // Indexes for better performance
// inventoryItemSchema.index({ category: 1 });
// inventoryItemSchema.index({ status: 1 });
// inventoryItemSchema.index({ location: 1 });
// inventoryItemSchema.index({ name: 'text', description: 'text' });

// module.exports = mongoose.model("InventoryItem", inventoryItemSchema);