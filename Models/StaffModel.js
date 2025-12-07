const mongoose = require("mongoose");

const workScheduleSchema = new mongoose.Schema({
  monday: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    working: { type: Boolean, default: true }
  },
  tuesday: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    working: { type: Boolean, default: true }
  },
  wednesday: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    working: { type: Boolean, default: true }
  },
  thursday: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    working: { type: Boolean, default: true }
  },
  friday: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    working: { type: Boolean, default: true }
  },
  saturday: {
    start: { type: String, default: '10:00' },
    end: { type: String, default: '14:00' },
    working: { type: Boolean, default: false }
  },
  sunday: {
    start: { type: String, default: '10:00' },
    end: { type: String, default: '14:00' },
    working: { type: Boolean, default: false }
  }
});

const staffSchema = new mongoose.Schema({
  staffNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TEMP-${Date.now()}`;
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['cleaner', 'maintenance', 'manager', 'concierge', 'supervisor'],
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0,
    min: 0
  },
  schedule: workScheduleSchema,
  department: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook for staff number
staffSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Staff = mongoose.model('Staff');
      const count = await Staff.countDocuments();
      this.staffNumber = `STF-${(count + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      this.staffNumber = `STF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

module.exports = mongoose.model("Staff", staffSchema);