// Models/AffiliateBookingModel.js
const mongoose = require("mongoose");

const affiliateBookingSchema = new mongoose.Schema({
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliate',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  affiliateCode: {
    type: String,
    required: true,
    index: true
  },
  // Booking details at time of affiliate association
  bookingDetails: {
    propertyTitle: String,
    propertyPrice: Number,
    checkIn: Date,
    checkOut: Date,
    nights: Number,
    guests: Number
  },
  bookingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionStatus: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  // When was the code applied
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payoutReference: String,
  notes: String,
  // For tracking
  metadata: {
    userEmail: String,
    userPhone: String,
    userLocation: String
  }
}, {
  timestamps: true
});

// Indexes for reporting
affiliateBookingSchema.index({ commissionStatus: 1, appliedAt: -1 });
affiliateBookingSchema.index({ affiliate: 1, commissionStatus: 1 });
affiliateBookingSchema.index({ appliedAt: -1 });

// Virtual for formatted commission
affiliateBookingSchema.virtual('formattedCommission').get(function() {
  return `₦${this.commissionAmount.toLocaleString()}`;
});

// Method to approve commission
affiliateBookingSchema.methods.approve = async function(userId) {
  this.commissionStatus = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = userId;
  
  // Update affiliate stats
  const Affiliate = mongoose.model('Affiliate');
  await Affiliate.findByIdAndUpdate(this.affiliate, {
    $inc: {
      'stats.pendingCommission': -this.commissionAmount,
      'stats.paidCommission': this.commissionAmount
    }
  });
  
  return this.save();
};

// Method to mark as paid
affiliateBookingSchema.methods.markAsPaid = async function(userId, payoutRef) {
  this.commissionStatus = 'paid';
  this.paidAt = new Date();
  this.paidBy = userId;
  this.payoutReference = payoutRef;
  return this.save();
};

module.exports = mongoose.model("AffiliateBooking", affiliateBookingSchema);