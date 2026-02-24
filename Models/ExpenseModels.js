const mongoose = require("mongoose");

// Expense Schema
const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['maintenance', 'supplies', 'utilities', 'staff', 'marketing', 
           'insurance', 'tax', 'repairs', 'cleaning', 'security', 
           'administrative', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unit: {
    type: String,
    trim: true
  },
  paidTo: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank transfer', 'card', 'digital', 'check'],
    required: true
  },
  receipt: {
    type: String, // URL to uploaded receipt
    default: ''
  },
  receiptFileId: {
    type: String, // Cloudinary or file storage ID
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: function() {
      return this.recurring;
    }
  },
  nextRecurrenceDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  budgetCategory: {
    type: String,
    trim: true
  },
  taxDeductible: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate expense number
expenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    try {
      const count = await mongoose.model('Expense').countDocuments();
      this.expenseNumber = `EXP-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      this.expenseNumber = `EXP-${Date.now()}`;
    }
  }
  next();
});

// Indexes
expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ property: 1, date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ tags: 1 });

// Budget Schema
const budgetSchema = new mongoose.Schema({
  budgetNumber: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  allocated: {
    type: Number,
    required: true,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  fiscalYear: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save hook to generate budget number
budgetSchema.pre('save', async function(next) {
  if (this.isNew && !this.budgetNumber) {
    try {
      const count = await mongoose.model('Budget').countDocuments();
      this.budgetNumber = `BUD-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      this.budgetNumber = `BUD-${Date.now()}`;
    }
  }
  next();
});

// Expense Vendor Schema (renamed from Vendor to ExpenseVendor to avoid conflict)
const expenseVendorSchema = new mongoose.Schema({
  vendorNumber: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'supplies', 'utilities', 'cleaning', 'security', 
           'marketing', 'insurance', 'other'],
    required: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  taxId: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net15', 'net30', 'net60'],
    default: 'net30'
  },
  preferred: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate vendor number
expenseVendorSchema.pre('save', async function(next) {
  if (this.isNew && !this.vendorNumber) {
    try {
      const count = await mongoose.model('ExpenseVendor').countDocuments();
      this.vendorNumber = `VEN-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      this.vendorNumber = `VEN-${Date.now()}`;
    }
  }
  next();
});

// Indexes
expenseVendorSchema.index({ vendorNumber: 1 });
expenseVendorSchema.index({ name: 'text', email: 'text' });
expenseVendorSchema.index({ category: 1 });
expenseVendorSchema.index({ preferred: 1 });

module.exports = {
  Expense: mongoose.model("Expense", expenseSchema),
  Budget: mongoose.model("Budget", budgetSchema),
  ExpenseVendor: mongoose.model("ExpenseVendor", expenseVendorSchema) // Renamed from Vendor
};