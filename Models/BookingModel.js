const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    checkIn: {
      type: Date,
      required: true
    },
    checkOut: {
      type: Date,
      required: true
    },
    guests: {
      type: Number,
      required: true,
      min: 1
    },
    totalAmount: {
      type: Number,
      required: true
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed', 'pending'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'bank_transfer', 'onsite'],
      default: 'paystack'
    },
    paymentReference: {
      type: String,
      unique: true
    },
    paystackReference: {
      type: String
    },
    paymentData: {
      type: Object
    },
    bankTransferDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      transferReference: String,
      transferDate: Date,
      proofOfPayment: String, // URL to uploaded proof
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      }
    },
    onsitePaymentDetails: {
      expectedAmount: Number,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      collectedAt: Date,
      receiptNumber: String,
      status: {
        type: String,
        enum: ['pending', 'collected', 'verified'],
        default: 'pending'
      }
    },
    accessPass: {
      code: {
        type: String,
        trim: true
      },
      providedBy: {
        type: String, // External provider name
        default: ''
      },
      sentAt: Date,
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      expiresAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'active', 'expired', 'used'],
        default: 'pending'
      },
      instructions: {
        type: String, // Any additional instructions for using the code
        default: ''
      }
    },
    cancellationReason: String,
    cancelledAt: Date,
    specialRequests: String
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ paymentReference: 1 });
bookingSchema.index({ paymentMethod: 1 });
bookingSchema.index({ "bankTransferDetails.status": 1 });
bookingSchema.index({ "onsitePaymentDetails.status": 1 });

// Virtual for total nights
bookingSchema.virtual('totalNights').get(function() {
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

// Check if dates are available
bookingSchema.statics.checkAvailability = async function(propertyId, checkIn, checkOut, excludeBookingId = null) {
  const query = {
    property: propertyId,
    bookingStatus: { $in: ['confirmed'] }, // Only check confirmed bookings (paid)
    $or: [
      { 
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await this.find(query);
  return conflictingBookings.length === 0;
};

module.exports = mongoose.model("Booking", bookingSchema);





































































































// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema(
//   {
//     property: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Property',
//       required: true
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     checkIn: {
//       type: Date,
//       required: true
//     },
//     checkOut: {
//       type: Date,
//       required: true
//     },
//     guests: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     totalAmount: {
//       type: Number,
//       required: true
//     },
//     serviceFee: {
//       type: Number,
//       default: 0
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'paid', 'failed', 'refunded'],
//       default: 'pending'
//     },
//     bookingStatus: {
//       type: String,
//       enum: ['confirmed', 'cancelled', 'completed', 'pending'],
//       default: 'pending'
//     },
//     paymentReference: {
//       type: String,
//       unique: true
//     },
//     paystackReference: {
//       type: String
//     },
//     paymentData: {
//       type: Object
//     },
//     accessPass: {
//       code: {
//         type: String,
//         trim: true
//       },
//       providedBy: {
//         type: String, // External provider name
//         default: ''
//       },
//       sentAt: Date,
//       sentBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//       },
//       expiresAt: Date,
//       status: {
//         type: String,
//         enum: ['pending', 'sent', 'active', 'expired', 'used'],
//         default: 'pending'
//       },
//       instructions: {
//         type: String, // Any additional instructions for using the code
//         default: ''
//       },
//       paymentMethod: {
//       type: String,
//       enum: ['paystack', 'bank_transfer', 'onsite'],
//       default: 'paystack'
//     },
    
//     bankTransferDetails: {
//       accountName: String,
//       accountNumber: String,
//       bankName: String,
//       transferReference: String,
//       transferDate: Date,
//       proofOfPayment: String, // URL to uploaded proof
//       verifiedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//       },
//       verifiedAt: Date,
//       status: {
//         type: String,
//         enum: ['pending', 'verified', 'rejected'],
//         default: 'pending'
//       }
//     },
    
//     onsitePaymentDetails: {
//       expectedAmount: Number,
//       collectedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//       },
//       collectedAt: Date,
//       receiptNumber: String,
//       status: {
//         type: String,
//         enum: ['pending', 'collected', 'verified'],
//         default: 'pending'
//       }
//     },
    
//     },
//     cancellationReason: String,
//     cancelledAt: Date,
//     specialRequests: String
//   },
//   { 
//     timestamps: true 
//   }
// );

// // Index for better query performance
// bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
// bookingSchema.index({ user: 1 });
// bookingSchema.index({ paymentReference: 1 });

// // Virtual for total nights
// bookingSchema.virtual('totalNights').get(function() {
//   return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
// });

// // Check if dates are available
// // bookingSchema.statics.checkAvailability = async function(propertyId, checkIn, checkOut, excludeBookingId = null) {
// //   const query = {
// //     property: propertyId,
// //     bookingStatus: { $in: ['confirmed', 'pending'] },
// //     $or: [
// //       { 
// //         checkIn: { $lt: new Date(checkOut) },
// //         checkOut: { $gt: new Date(checkIn) }
// //       }
// //     ]
// //   };

// //   if (excludeBookingId) {
// //     query._id = { $ne: excludeBookingId };
// //   }

// //   const conflictingBookings = await this.find(query);
// //   return conflictingBookings.length === 0;
// // };

// // models/BookingModel.js - Update the checkAvailability method
// bookingSchema.statics.checkAvailability = async function(propertyId, checkIn, checkOut, excludeBookingId = null) {
//   const query = {
//     property: propertyId,
//     bookingStatus: { $in: ['confirmed'] }, // Only check confirmed bookings (paid)
//     $or: [
//       { 
//         checkIn: { $lt: new Date(checkOut) },
//         checkOut: { $gt: new Date(checkIn) }
//       }
//     ]
//   };

//   if (excludeBookingId) {
//     query._id = { $ne: excludeBookingId };
//   }

//   const conflictingBookings = await this.find(query);
//   return conflictingBookings.length === 0;
// };

// module.exports = mongoose.model("Booking", bookingSchema);

  
    
    