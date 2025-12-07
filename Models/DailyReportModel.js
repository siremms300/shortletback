const mongoose = require("mongoose");

const dailyReportSchema = new mongoose.Schema({
  reportNumber: {
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
  tasksCompleted: [{
    type: String,
    trim: true
  }],
  issuesReported: [{
    type: String,
    trim: true
  }],
  suppliesUsed: [{
    type: String,
    trim: true
  }],
  guestFeedback: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook for report number
dailyReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const DailyReport = mongoose.model('DailyReport');
      const count = await DailyReport.countDocuments();
      this.reportNumber = `RPT-${(count + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      this.reportNumber = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

module.exports = mongoose.model("DailyReport", dailyReportSchema); 
