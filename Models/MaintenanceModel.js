// Models/MaintenanceModel.js - FIXED VERSION
const mongoose = require("mongoose");

const maintenanceIssueSchema = new mongoose.Schema({
  issueNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TEMP-${Date.now()}`; // Temporary default
    }
  },
  apartment: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'appliance', 'furniture', 'structural', 'hvac', 'pest-control', 'safety', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  reportedBy: {
    type: String,
    required: true,
    trim: true
  },
  reportedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['reported', 'assigned', 'in-progress', 'completed', 'verified', 'reopened'],
    default: 'reported'
  },
  assignedTo: {
    type: String,
    default: ''
  },
  assignedToVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceVendor'
  },
  estimatedCost: {
    type: Number,
    min: 0,
    default: 0
  },
  actualCost: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    min: 0,
    default: 0
  },
  actualDuration: {
    type: Number,
    min: 0,
    default: 0
  },
  scheduledDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  warranty: {
    type: Boolean,
    default: false
  },
  nextMaintenanceDate: {
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

// FIXED: More robust pre-save middleware to generate issue number
maintenanceIssueSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered for MaintenanceIssue');
  
  if (this.isNew) {
    try {
      console.log('Generating issue number...');
      
      // Method 1: Try counting documents first
      const MaintenanceIssue = mongoose.model('MaintenanceIssue');
      const count = await MaintenanceIssue.countDocuments();
      const issueNumber = `MT-${(count + 1).toString().padStart(3, '0')}`;
      
      console.log('Generated issue number:', issueNumber);
      this.issueNumber = issueNumber;
      
    } catch (countError) {
      console.log('Count failed, using fallback method:', countError.message);
      
      // Method 2: Fallback to timestamp + random
      const fallbackIssueNumber = `MT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      console.log('Fallback issue number:', fallbackIssueNumber);
      this.issueNumber = fallbackIssueNumber;
    }
  }
  
  console.log('Final issueNumber:', this.issueNumber);
  next();
});

// Indexes for better performance
maintenanceIssueSchema.index({ status: 1 });
maintenanceIssueSchema.index({ priority: 1 });
maintenanceIssueSchema.index({ category: 1 });
maintenanceIssueSchema.index({ apartment: 1 });
maintenanceIssueSchema.index({ createdAt: -1 });

module.exports = mongoose.model("MaintenanceIssue", maintenanceIssueSchema);




































// // Models/MaintenanceModel.js
// const mongoose = require("mongoose");

// const maintenanceIssueSchema = new mongoose.Schema({
//   issueNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   apartment: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   unit: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     enum: ['plumbing', 'electrical', 'appliance', 'furniture', 'structural', 'hvac', 'pest-control', 'safety', 'other'],
//     required: true
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high', 'urgent'],
//     required: true,
//     default: 'medium'
//   },
//   description: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   reportedBy: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   reportedByUser: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   status: {
//     type: String,
//     enum: ['reported', 'assigned', 'in-progress', 'completed', 'verified', 'reopened'],
//     default: 'reported'
//   },
//   assignedTo: {
//     type: String,
//     default: ''
//   },
//   assignedToVendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'MaintenanceVendor'
//   },
//   estimatedCost: {
//     type: Number,
//     min: 0,
//     default: 0
//   },
//   actualCost: {
//     type: Number,
//     min: 0,
//     default: 0
//   },
//   estimatedDuration: {
//     type: Number,
//     min: 0,
//     default: 0
//   },
//   actualDuration: {
//     type: Number,
//     min: 0,
//     default: 0
//   },
//   scheduledDate: {
//     type: Date
//   },
//   completedAt: {
//     type: Date
//   },
//   verifiedAt: {
//     type: Date
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   images: [{
//     type: String
//   }],
//   warranty: {
//     type: Boolean,
//     default: false
//   },
//   nextMaintenanceDate: {
//     type: Date
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, {
//   timestamps: true
// });

// // Pre-save middleware to generate issue number
// maintenanceIssueSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const MaintenanceIssue = mongoose.model('MaintenanceIssue');
//       const lastIssue = await MaintenanceIssue.findOne().sort({ issueNumber: -1 });
      
//       let nextNumber = 1;
//       if (lastIssue && lastIssue.issueNumber) {
//         const lastNumber = parseInt(lastIssue.issueNumber.split('-')[1]);
//         if (!isNaN(lastNumber)) {
//           nextNumber = lastNumber + 1;
//         }
//       }
      
//       this.issueNumber = `MT-${nextNumber.toString().padStart(3, '0')}`;
//     } catch (error) {
//       console.error('Error generating issue number:', error);
//       this.issueNumber = `MT-${Date.now()}`;
//     }
//   }
//   next();
// });

// // Indexes for better performance
// maintenanceIssueSchema.index({ status: 1 });
// maintenanceIssueSchema.index({ priority: 1 });
// maintenanceIssueSchema.index({ category: 1 });
// maintenanceIssueSchema.index({ apartment: 1 });
// maintenanceIssueSchema.index({ createdAt: -1 });

// module.exports = mongoose.model("MaintenanceIssue", maintenanceIssueSchema);