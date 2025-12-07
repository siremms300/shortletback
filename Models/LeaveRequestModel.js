const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TEMP-${Date.now()}`;
    }
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'emergency'],
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
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook for request number
leaveRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const LeaveRequest = mongoose.model('LeaveRequest');
      const count = await LeaveRequest.countDocuments();
      this.requestNumber = `LEAVE-${(count + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      this.requestNumber = `LEAVE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

// Index for better performance
leaveRequestSchema.index({ staff: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);