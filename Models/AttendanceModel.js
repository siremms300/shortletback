const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  attendanceNumber: {
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave', 'half-day'],
    default: 'present'
  },
  hoursWorked: {
    type: Number,
    min: 0
  },
  lateMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook for attendance number
attendanceSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Attendance = mongoose.model('Attendance');
      const count = await Attendance.countDocuments();
      this.attendanceNumber = `ATT-${(count + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      this.attendanceNumber = `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

// Index for better performance
attendanceSchema.index({ staff: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);