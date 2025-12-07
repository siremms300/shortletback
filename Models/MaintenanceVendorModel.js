// Models/MaintenanceVendorModel.js - FIXED VERSION
const mongoose = require("mongoose");

const maintenanceVendorSchema = new mongoose.Schema({
  vendorNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `TEMP-${Date.now()}`; // Temporary default
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialty: [{
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'furniture', 'structural', 'pest-control', 'safety', 'cleaning', 'painting']
  }],
  contact: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  responseTime: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// FIXED: More robust pre-save hook for vendor number generation
maintenanceVendorSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered for MaintenanceVendor');
  
  if (this.isNew) {
    try {
      console.log('Generating vendor number...');
      
      // Method 1: Try counting documents first
      const MaintenanceVendor = mongoose.model('MaintenanceVendor');
      const count = await MaintenanceVendor.countDocuments();
      const vendorNumber = `V-${(count + 1).toString().padStart(3, '0')}`;
      
      console.log('Generated vendor number:', vendorNumber);
      this.vendorNumber = vendorNumber;
      
    } catch (countError) {
      console.log('Count failed, using fallback method:', countError.message);
      
      // Method 2: Fallback to timestamp + random
      const fallbackVendorNumber = `V-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      console.log('Fallback vendor number:', fallbackVendorNumber);
      this.vendorNumber = fallbackVendorNumber;
    }
  }
  
  console.log('Final vendorNumber:', this.vendorNumber);
  next();
});

// Alternative: Use a static method to generate vendor number
maintenanceVendorSchema.statics.generateVendorNumber = async function() {
  try {
    const count = await this.countDocuments();
    return `V-${(count + 1).toString().padStart(3, '0')}`;
  } catch (error) {
    return `V-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
};

// Indexes
maintenanceVendorSchema.index({ specialty: 1 });
maintenanceVendorSchema.index({ rating: -1 });
maintenanceVendorSchema.index({ isActive: 1 });

module.exports = mongoose.model("MaintenanceVendor", maintenanceVendorSchema);




























// // Models/MaintenanceVendorModel.js
// const mongoose = require("mongoose");

// const maintenanceVendorSchema = new mongoose.Schema({
//   vendorNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   specialty: [{
//     type: String,
//     enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'furniture', 'structural', 'pest-control', 'safety', 'cleaning', 'painting']
//   }],
//   contact: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     trim: true,
//     lowercase: true
//   },
//   rating: {
//     type: Number,
//     min: 1,
//     max: 5,
//     default: 5
//   },
//   responseTime: {
//     type: String,
//     required: true
//   },
//   address: {
//     type: String,
//     default: ''
//   },
//   website: {
//     type: String,
//     default: ''
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }
// }, {
//   timestamps: true
// });

// // Pre-save middleware to generate vendor number
// maintenanceVendorSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const MaintenanceVendor = mongoose.model('MaintenanceVendor');
//       const lastVendor = await MaintenanceVendor.findOne().sort({ vendorNumber: -1 });
      
//       let nextNumber = 1;
//       if (lastVendor && lastVendor.vendorNumber) {
//         const lastNumber = parseInt(lastVendor.vendorNumber.split('-')[1]);
//         if (!isNaN(lastNumber)) {
//           nextNumber = lastNumber + 1;
//         }
//       }
      
//       this.vendorNumber = `V-${nextNumber.toString().padStart(3, '0')}`;
//     } catch (error) {
//       console.error('Error generating vendor number:', error);
//       this.vendorNumber = `V-${Date.now()}`;
//     }
//   }
//   next();
// });

// // Indexes
// maintenanceVendorSchema.index({ specialty: 1 });
// maintenanceVendorSchema.index({ rating: -1 });
// maintenanceVendorSchema.index({ isActive: 1 });

// module.exports = mongoose.model("MaintenanceVendor", maintenanceVendorSchema);