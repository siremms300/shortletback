// Models/AffiliateModel.js
const mongoose = require("mongoose");

const affiliatePayoutSchema = new mongoose.Schema({
  payoutNumber: {
    type: String,
    unique: true,
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  totalEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  totalBookings: {
    type: Number,
    required: true,
    min: 0
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paystack', 'cash'],
    required: true
  },
  paymentReference: String,
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

const affiliateSchema = new mongoose.Schema({
  affiliateNumber: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  // Unique affiliate code (e.g., ES-12345)
  affiliateCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  // Initials derived from name
  initials: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 5 // Default 5%
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // Contact person details
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  // Bank details for payouts
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    bankCode: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'Nigeria'
    }
  },
  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    paidCommission: {
      type: Number,
      default: 0
    },
    pendingCommission: {
      type: Number,
      default: 0
    }
  },
  payouts: [affiliatePayoutSchema],
  // Tracking
  lastBookingAt: Date,
  lastPayoutAt: Date,
  notes: String,
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

// Pre-save hook to generate affiliate code and initials
affiliateSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Generate initials from name
      const nameParts = this.name.split(' ');
      if (nameParts.length >= 2) {
        this.initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        this.initials = nameParts[0].substring(0, 2).toUpperCase();
      }
      
      // Generate unique affiliate code
      const Affiliate = mongoose.model('Affiliate');
      
      // Get count of affiliates with same initials to create unique number
      const count = await Affiliate.countDocuments({ 
        initials: this.initials 
      });
      
      // Format: ES-001, ES-002 etc.
      const sequentialNumber = (count + 1).toString().padStart(3, '0');
      this.affiliateCode = `${this.initials}-${sequentialNumber}`;
      
      // Also generate affiliate number for internal use
      const totalCount = await Affiliate.countDocuments();
      this.affiliateNumber = `AFF-${(totalCount + 1).toString().padStart(4, '0')}`;
      
    } catch (error) {
      console.error('Error generating affiliate code:', error);
      // Fallback
      this.affiliateCode = `AFF-${Date.now()}`;
      this.affiliateNumber = `AFF-${Date.now()}`;
      this.initials = this.name.substring(0, 2).toUpperCase();
    }
  }
  next();
});

// Method to update stats
affiliateSchema.methods.updateStats = async function() {
  const AffiliateBooking = mongoose.model('AffiliateBooking');
  
  // Get all bookings for this affiliate
  const bookings = await AffiliateBooking.find({ 
    affiliate: this._id,
    commissionStatus: { $ne: 'cancelled' }
  });
  
  const totalBookings = bookings.length;
  const totalEarnings = bookings.reduce((sum, b) => sum + b.bookingAmount, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);
  const paidCommission = bookings
    .filter(b => b.commissionStatus === 'paid')
    .reduce((sum, b) => sum + b.commissionAmount, 0);
  const pendingCommission = bookings
    .filter(b => b.commissionStatus === 'pending')
    .reduce((sum, b) => sum + b.commissionAmount, 0);
  
  this.stats = {
    totalBookings,
    totalEarnings,
    totalCommission,
    paidCommission,
    pendingCommission
  };
  
  if (bookings.length > 0) {
    this.lastBookingAt = bookings[0].createdAt;
  }
  
  return this.save();
};

// Indexes
affiliateSchema.index({ affiliateCode: 1 });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ email: 1 });
affiliateSchema.index({ initials: 1 });
affiliateSchema.index({ 'stats.totalEarnings': -1 });

module.exports = mongoose.model("Affiliate", affiliateSchema);