const mongoose = require("mongoose");

// Utility Reading Schema
const utilityReadingSchema = new mongoose.Schema({
  readingNumber: {
    type: String,
    unique: true,
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'],
    required: true
  },
  previousReading: {
    type: Number,
    required: true,
    min: 0
  },
  currentReading: {
    type: Number,
    required: true,
    min: 0
  },
  consumption: {
    type: Number,
    default: 0
  },
  readingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  billed: {
    type: Boolean,
    default: false
  },
  billedAt: {
    type: Date
  },
  meterNumber: {
    type: String,
    trim: true
  },
  estimated: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
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

// Pre-save hook to generate reading number
utilityReadingSchema.pre('save', async function(next) {
  if (this.isNew && !this.readingNumber) {
    try {
      const count = await mongoose.model('UtilityReading').countDocuments();
      this.readingNumber = `UTL-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      this.readingNumber = `UTL-${Date.now()}`;
    }
  }
  next();
});

// Pre-save hook to calculate consumption
utilityReadingSchema.pre('save', function(next) {
  if (this.currentReading > this.previousReading) {
    this.consumption = this.currentReading - this.previousReading;
  }
  next();
});

// Indexes
utilityReadingSchema.index({ property: 1, readingDate: -1 });
utilityReadingSchema.index({ type: 1, readingDate: -1 });
utilityReadingSchema.index({ billed: 1 });

// Utility Rate Schema
const utilityRateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'],
    required: true,
    unique: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kWh', 'm³', 'GB', 'monthly', 'unit']
  },
  tier1Limit: {
    type: Number,
    min: 0
  },
  tier1Rate: {
    type: Number,
    min: 0
  },
  tier2Limit: {
    type: Number,
    min: 0
  },
  tier2Rate: {
    type: Number,
    min: 0
  },
  tier3Rate: {
    type: Number,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Utility Alert Schema
const utilityAlertSchema = new mongoose.Schema({
  alertNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['high_usage', 'unusual_consumption', 'meter_issue', 'billing_due', 'rate_change'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  message: {
    type: String,
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  unit: {
    type: String
  },
  utilityType: {
    type: String,
    enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage', 'all']
  },
  value: {
    type: Number
  },
  threshold: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Pre-save hook for alert number
utilityAlertSchema.pre('save', async function(next) {
  if (this.isNew && !this.alertNumber) {
    try {
      const count = await mongoose.model('UtilityAlert').countDocuments();
      this.alertNumber = `ALT-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      this.alertNumber = `ALT-${Date.now()}`;
    }
  }
  next();
}); 

module.exports = {
  UtilityReading: mongoose.model("UtilityReading", utilityReadingSchema),
  UtilityRate: mongoose.model("UtilityRate", utilityRateSchema),
  UtilityAlert: mongoose.model("UtilityAlert", utilityAlertSchema)
};














































// const mongoose = require("mongoose");

// // Utility Reading Schema
// const utilityReadingSchema = new mongoose.Schema({
//   readingNumber: {
//     type: String,
//     unique: true,
//     required: true,
//     default: function() {
//       return `UTL-${Date.now()}`;
//     }
//   },
//   property: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true
//   },
//   unit: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   type: {
//     type: String,
//     enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'],
//     required: true
//   },
//   previousReading: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   currentReading: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   consumption: {
//     type: Number,
//     default: 0
//   },
//   readingDate: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   cost: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   rate: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   billed: {
//     type: Boolean,
//     default: false
//   },
//   billedAt: {
//     type: Date
//   },
//   meterNumber: {
//     type: String,
//     trim: true
//   },
//   estimated: {
//     type: Boolean,
//     default: false
//   },
//   notes: {
//     type: String,
//     trim: true
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, { 
//   timestamps: true 
// });

// // Pre-save hook to calculate consumption
// utilityReadingSchema.pre('save', function(next) {
//   if (this.currentReading > this.previousReading) {
//     this.consumption = this.currentReading - this.previousReading;
//   } else {
//     this.consumption = 0;
//   }
//   next();
// });

// // Indexes
// utilityReadingSchema.index({ property: 1, readingDate: -1 });
// utilityReadingSchema.index({ type: 1, readingDate: -1 });
// utilityReadingSchema.index({ billed: 1 });

// // Utility Rate Schema
// const utilityRateSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'],
//     required: true,
//     unique: true
//   },
//   rate: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   unit: {
//     type: String,
//     required: true,
//     enum: ['kWh', 'm³', 'GB', 'monthly', 'liter', 'unit']
//   },
//   tier1Limit: {
//     type: Number,
//     min: 0
//   },
//   tier1Rate: {
//     type: Number,
//     min: 0
//   },
//   tier2Limit: {
//     type: Number,
//     min: 0
//   },
//   tier2Rate: {
//     type: Number,
//     min: 0
//   },
//   tier3Rate: {
//     type: Number,
//     min: 0
//   },
//   lastUpdated: {
//     type: Date,
//     default: Date.now
//   },
//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, { 
//   timestamps: true 
// });

// // Utility Alert Schema
// const utilityAlertSchema = new mongoose.Schema({
//   alertNumber: {
//     type: String,
//     unique: true,
//     required: true,
//     default: function() {
//       return `ALT-${Date.now()}`;
//     }
//   },
//   type: {
//     type: String,
//     enum: ['high_usage', 'unusual_consumption', 'meter_issue', 'billing_due', 'rate_change'],
//     required: true
//   },
//   severity: {
//     type: String,
//     enum: ['low', 'medium', 'high'],
//     default: 'medium'
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   property: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property'
//   },
//   unit: {
//     type: String
//   },
//   utilityType: {
//     type: String,
//     enum: ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage', 'all']
//   },
//   value: {
//     type: Number
//   },
//   threshold: {
//     type: Number
//   },
//   date: {
//     type: Date,
//     default: Date.now
//   },
//   resolved: {
//     type: Boolean,
//     default: false
//   },
//   resolvedAt: {
//     type: Date
//   },
//   resolvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, { 
//   timestamps: true 
// });

// // Utility Stats Schema (for caching calculations)
// const utilityStatsSchema = new mongoose.Schema({
//   period: {
//     type: String,
//     enum: ['monthly', 'quarterly', 'yearly'],
//     required: true
//   },
//   year: {
//     type: Number,
//     required: true
//   },
//   month: {
//     type: Number
//   },
//   quarter: {
//     type: Number
//   },
//   data: {
//     totalReadings: Number,
//     totalConsumption: Number,
//     totalCost: Number,
//     unbilledAmount: Number,
//     averageConsumption: Number,
//     utilityBreakdown: [{
//       type: String,
//       consumption: Number,
//       cost: Number,
//       count: Number
//     }],
//     propertyStats: [{
//       property: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Property'
//       },
//       consumption: Number,
//       cost: Number
//     }]
//   },
//   calculatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Ensure unique compound index
// utilityStatsSchema.index({ period: 1, year: 1, month: 1, quarter: 1 }, { unique: true, sparse: true });

// module.exports = {
//   UtilityReading: mongoose.model("UtilityReading", utilityReadingSchema),
//   UtilityRate: mongoose.model("UtilityRate", utilityRateSchema),
//   UtilityAlert: mongoose.model("UtilityAlert", utilityAlertSchema),
//   UtilityStats: mongoose.model("UtilityStats", utilityStatsSchema)
// };