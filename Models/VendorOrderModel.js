// Models/VendorOrderModel.js - UPDATED VERSION
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorProduct',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  specialInstructions: String
});

const vendorOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Fallback default function
      return `VOR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    property: String,
    unit: String,
    specialInstructions: String
  },
  preferredDeliveryTime: Date,
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: String,
  paystackReference: String,
  paymentData: Object,
  vendorNotes: String,
  customerNotes: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  cancellationReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  refundReason: String
}, { 
  timestamps: true 
});

// FIXED: More robust pre-save hook
vendorOrderSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered for VendorOrder');
  
  if (this.isNew && !this.orderNumber) {
    try {
      console.log('Generating order number...');
      
      // Method 1: Try counting documents first
      const VendorOrderModel = mongoose.model('VendorOrder');
      const count = await VendorOrderModel.countDocuments();
      const orderNumber = `VOR-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
      
      console.log('Generated order number:', orderNumber);
      this.orderNumber = orderNumber;
      
    } catch (countError) {
      console.log('Count failed, using fallback method:', countError.message);
      
      // Method 2: Fallback to timestamp + random
      const fallbackOrderNumber = `VOR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      console.log('Fallback order number:', fallbackOrderNumber);
      this.orderNumber = fallbackOrderNumber;
    }
  }
  
  console.log('Final orderNumber:', this.orderNumber);
  next();
});

// Alternative: Use a static method to generate order number
vendorOrderSchema.statics.generateOrderNumber = async function() {
  try {
    const count = await this.countDocuments();
    return `VOR-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    return `VOR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
};

// Indexes
vendorOrderSchema.index({ user: 1 });
vendorOrderSchema.index({ vendor: 1 });
vendorOrderSchema.index({ booking: 1 });
vendorOrderSchema.index({ orderNumber: 1 });
vendorOrderSchema.index({ orderStatus: 1, paymentStatus: 1 });

module.exports = mongoose.model("VendorOrder", vendorOrderSchema);



































// // Models/VendorOrderModel.js - Fix the pre-save hook
// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'VendorProduct',
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   price: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   specialInstructions: String
// });

// const vendorOrderSchema = new mongoose.Schema({
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   booking: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Booking',
//     required: true
//   },
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true
//   },
//   items: [orderItemSchema],
//   subtotal: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   serviceFee: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   deliveryFee: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   deliveryAddress: {
//     property: String,
//     unit: String,
//     specialInstructions: String
//   },
//   preferredDeliveryTime: Date,
//   orderStatus: {
//     type: String,
//     enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
//     default: 'pending'
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   paymentReference: String,
//   paystackReference: String,
//   paymentData: Object,
//   vendorNotes: String,
//   customerNotes: String,
//   estimatedDeliveryTime: Date,
//   actualDeliveryTime: Date,
//   cancellationReason: String,
//   cancelledAt: Date,
//   refundAmount: Number,
//   refundReason: String
// }, { timestamps: true });

// // FIXED: Generate order number before saving
// vendorOrderSchema.pre('save', async function(next) {
//   if (this.isNew && !this.orderNumber) {
//     try {
//       // Get the count of existing vendor orders
//       const count = await mongoose.model('VendorOrder').countDocuments();
//       // Generate unique order number
//       this.orderNumber = `VOR-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
//     } catch (error) {
//       // Fallback if count fails
//       this.orderNumber = `VOR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
//     }
//   }
//   next();
// });

// // Indexes for better performance
// vendorOrderSchema.index({ user: 1 });
// vendorOrderSchema.index({ vendor: 1 });
// vendorOrderSchema.index({ booking: 1 });
// vendorOrderSchema.index({ orderNumber: 1 });
// vendorOrderSchema.index({ orderStatus: 1, paymentStatus: 1 });

// module.exports = mongoose.model("VendorOrder", vendorOrderSchema);

















































// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'VendorProduct',
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   price: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   specialInstructions: String
// });

// const vendorOrderSchema = new mongoose.Schema({
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   booking: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Booking',
//     required: true
//   },
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//     required: true
//   },
//   items: [orderItemSchema],
//   subtotal: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   serviceFee: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   deliveryFee: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   deliveryAddress: {
//     property: String,
//     unit: String,
//     specialInstructions: String
//   },
//   preferredDeliveryTime: Date,
//   orderStatus: {
//     type: String,
//     enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
//     default: 'pending'
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   paymentReference: String,
//   paystackReference: String,
//   paymentData: Object,
//   vendorNotes: String,
//   customerNotes: String,
//   estimatedDeliveryTime: Date,
//   actualDeliveryTime: Date,
//   cancellationReason: String,
//   cancelledAt: Date,
//   refundAmount: Number,
//   refundReason: String
// }, { timestamps: true });

// // Generate order number before saving
// vendorOrderSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const count = await mongoose.model('VendorOrder').countDocuments();
//     this.orderNumber = `VOR-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
//   }
//   next();
// });

// // Indexes for better performance
// vendorOrderSchema.index({ user: 1 });
// vendorOrderSchema.index({ vendor: 1 });
// vendorOrderSchema.index({ booking: 1 });
// vendorOrderSchema.index({ orderNumber: 1 });
// vendorOrderSchema.index({ orderStatus: 1, paymentStatus: 1 });

// module.exports = mongoose.model("VendorOrder", vendorOrderSchema);