// Models/HousekeepingModel.js - FIXED VERSION
const mongoose = require("mongoose");

const housekeepingRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
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
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  type: {
    type: String,
    enum: ['cleaning', 'linen', 'amenities', 'maintenance', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'verified', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: String,
    default: ''
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 30
  },
  actualDuration: {
    type: Number // in minutes
  },
  notes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  scheduledTime: Date,
  completedAt: Date,
  verifiedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, { 
  timestamps: true 
});

// FIXED: Generate request number before save
housekeepingRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    try {
      // Get the count of existing documents more reliably
      const HousekeepingRequest = mongoose.model('HousekeepingRequest');
      const count = await HousekeepingRequest.countDocuments();
      this.requestNumber = `HK-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback if count fails
      this.requestNumber = `HK-${Date.now()}`;
    }
  }
  next();
});

// Alternative: Use a static method to generate request number
housekeepingRequestSchema.statics.generateRequestNumber = async function() {
  try {
    const count = await this.countDocuments();
    return `HK-${(count + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    return `HK-${Date.now()}`;
  }
};

// Indexes for better performance
housekeepingRequestSchema.index({ user: 1 });
housekeepingRequestSchema.index({ property: 1 });
housekeepingRequestSchema.index({ status: 1 });
housekeepingRequestSchema.index({ priority: 1 });
housekeepingRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("HousekeepingRequest", housekeepingRequestSchema);































































// // Models/HousekeepingModel.js
// const mongoose = require("mongoose");

// const housekeepingRequestSchema = new mongoose.Schema({
//   requestNumber: {
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
//   property: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['cleaning', 'linen', 'amenities', 'maintenance', 'other'],
//     required: true
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high', 'urgent'],
//     default: 'medium'
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'in-progress', 'completed', 'verified', 'cancelled'],
//     default: 'pending'
//   },
//   assignedTo: {
//     type: String,
//     default: ''
//   },
//   estimatedDuration: {
//     type: Number, // in minutes
//     default: 30
//   },
//   actualDuration: {
//     type: Number // in minutes
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   adminNotes: {
//     type: String,
//     default: ''
//   },
//   images: [{
//     url: String,
//     description: String,
//     uploadedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   scheduledTime: Date,
//   completedAt: Date,
//   verifiedAt: Date,
//   cancelledAt: Date,
//   cancellationReason: String
// }, { 
//   timestamps: true 
// });

// // Generate request number before save
// housekeepingRequestSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const count = await mongoose.model('HousekeepingRequest').countDocuments();
//     this.requestNumber = `HK-${(count + 1).toString().padStart(4, '0')}`;
//   }
//   next();
// });

// // Indexes for better performance
// housekeepingRequestSchema.index({ user: 1 });
// housekeepingRequestSchema.index({ property: 1 });
// housekeepingRequestSchema.index({ status: 1 });
// housekeepingRequestSchema.index({ priority: 1 });
// housekeepingRequestSchema.index({ createdAt: -1 });

// module.exports = mongoose.model("HousekeepingRequest", housekeepingRequestSchema);