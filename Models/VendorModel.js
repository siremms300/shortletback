const mongoose = require("mongoose");

const vendorProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'beverages', 'essentials', 'amenities', 'concierge', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    url: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  maxOrderQuantity: {
    type: Number,
    default: 10
  },
  preparationTime: {
    type: Number, // in minutes
    default: 30
  },
  tags: [String]
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  contactPerson: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  services: [{
    type: String,
    enum: ['food_delivery', 'housekeeping', 'concierge', 'maintenance', 'supplies']
  }],
  operatingHours: {
    open: String,
    close: String,
    timezone: {
      type: String,
      default: 'Africa/Lagos'
    }
  },
  commissionRate: {
    type: Number, // percentage
    default: 15,
    min: 0,
    max: 100
  },
  paymentTerms: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    default: 'bi-weekly'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, { timestamps: true });

// Indexes for better performance
vendorProductSchema.index({ vendor: 1, isAvailable: 1 });
vendorProductSchema.index({ category: 1, isAvailable: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ 'contactPerson.email': 1 });

module.exports = {
  Vendor: mongoose.model("Vendor", vendorSchema),
  VendorProduct: mongoose.model("VendorProduct", vendorProductSchema)
};



