const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['apartment', 'villa', 'studio', 'penthouse', 'cottage']
    },
    price: {
      type: Number,
      required: true,
      min: 1
    },
    // Add these new fields
    utilityPercentage: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    },
    serviceChargePercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    vatPercentage: {
      type: Number,
      default: 7.5,
      min: 0,
      max: 100
    },
    // Virtual fields for calculated prices
    calculatedPrices: {
      type: Object,
      default: {}
    },
    location: {
      type: String,
      required: true
    },
    images: [{
      url: String,
      isMain: {
        type: Boolean,
        default: false
      },
      order: Number
    }],
    specifications: {
      bedrooms: {
        type: Number,
        default: 0
      },
      bathrooms: {
        type: Number,
        default: 0
      },
      maxGuests: {
        type: Number,
        default: 1
      },
      squareFeet: {
        type: Number,
        default: 0
      }
    },
    amenities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity'
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'draft'],
      default: 'draft'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalBookings: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    availability: {
      startDate: Date,
      endDate: Date,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual getter for calculated prices
// propertySchema.virtual('priceBreakdown').get(function() {
//   const actualPrice = this.price;
//   const utility = (actualPrice * this.utilityPercentage) / 100;
//   const serviceCharge = (actualPrice * this.serviceChargePercentage) / 100;
//   const accommodation = actualPrice - utility - serviceCharge;
//   const vat = (accommodation * this.vatPercentage) / 100;
//   const total = actualPrice + vat;
  
//   return {
//     actualPrice,
//     utilityPercentage: this.utilityPercentage,
//     utility,
//     serviceChargePercentage: this.serviceChargePercentage,
//     serviceCharge,
//     accommodation,
//     vatPercentage: this.vatPercentage,
//     vat,
//     total
//   };
// });

// propertySchema.virtual('priceBreakdown').get(function() {
//   const actualPrice = this.price;
//   const utility = (actualPrice * this.utilityPercentage) / 100;
//   const serviceCharge = (actualPrice * this.serviceChargePercentage) / 100;
//   const accommodation = actualPrice - utility - serviceCharge;
//   const vat = (accommodation * this.vatPercentage) / 100;
//   const total = actualPrice + vat;  // CORRECT: Actual + VAT on Accommodation
  
//   return {
//     actualPrice,
//     utilityPercentage: this.utilityPercentage,
//     utility,
//     serviceChargePercentage: this.serviceChargePercentage,
//     serviceCharge,
//     accommodation,
//     vatPercentage: this.vatPercentage,
//     vat,
//     total  // This is the total per night
//   };
// });

propertySchema.virtual('priceBreakdown').get(function() {
  const actualPrice = this.price;
  const utilityPercentage = this.utilityPercentage || 20;
  const serviceChargePercentage = this.serviceChargePercentage || 10;
  const vatPercentage = this.vatPercentage || 7.5;
  
  const utility = (actualPrice * utilityPercentage) / 100;
  const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
  const accommodation = actualPrice - utility - serviceCharge;
  const vat = (accommodation * vatPercentage) / 100;
  const total = actualPrice + vat; // Actual price + VAT on accommodation
  
  return {
    actualPrice,
    utilityPercentage,
    utility,
    serviceChargePercentage,
    serviceCharge,
    accommodation,
    vatPercentage,
    vat,
    total
  };
});

// Method to update calculated prices
propertySchema.methods.calculatePrices = function() {
  const breakdown = this.priceBreakdown;
  this.calculatedPrices = breakdown;
  return breakdown;
};

// Middleware to update calculated prices before saving
propertySchema.pre('save', function(next) {
  if (this.isModified('price') || 
      this.isModified('utilityPercentage') || 
      this.isModified('serviceChargePercentage') || 
      this.isModified('vatPercentage')) {
    this.calculatePrices();
  }
  next();
});

// Index for better query performance
propertySchema.index({ location: 'text', title: 'text' });
propertySchema.index({ status: 1, isFeatured: 1 });
propertySchema.index({ owner: 1 });

module.exports = mongoose.model("Property", propertySchema);














































































// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2 the code below works 
// const mongoose = require("mongoose");

// const propertySchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     description: {
//       type: String,
//       required: true
//     },
//     type: {
//       type: String,
//       required: true,
//       enum: ['apartment', 'villa', 'studio', 'penthouse', 'cottage']
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     location: {
//       type: String,
//       required: true
//     },
//     images: [{
//       url: String,
//       isMain: {
//         type: Boolean,
//         default: false
//       },
//       order: Number
//     }],
//     specifications: {
//       bedrooms: {
//         type: Number,
//         default: 0
//       },
//       bathrooms: {
//         type: Number,
//         default: 0
//       },
//       maxGuests: {
//         type: Number,
//         default: 1
//       },
//       squareFeet: {
//         type: Number,
//         default: 0
//       }
//     },
//     amenities: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Amenity'
//     }],
//     status: {
//       type: String,
//       enum: ['active', 'inactive', 'pending', 'draft'],
//       default: 'draft'
//     },
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5
//     },
//     totalBookings: {
//       type: Number,
//       default: 0
//     },
//     isFeatured: {
//       type: Boolean,
//       default: false
//     },
//     availability: {
//       startDate: Date,
//       endDate: Date,
//       isAvailable: {
//         type: Boolean,
//         default: true
//       }
//     }
//   },
//   { 
//     timestamps: true 
//   }
// );

// // Index for better query performance
// propertySchema.index({ location: 'text', title: 'text' });
// propertySchema.index({ status: 1, isFeatured: 1 });
// propertySchema.index({ owner: 1 });

// module.exports = mongoose.model("Property", propertySchema);





































































// const mongoose = require("mongoose");

// const propertySchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     description: {
//       type: String,
//       required: true
//     },
//     type: {
//       type: String,
//       required: true,
//       enum: ['apartment', 'villa', 'studio', 'penthouse', 'cottage']
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     location: {
//       type: String,
//       required: true
//     },
//     images: [{
//       url: String,
//       isMain: {
//         type: Boolean,
//         default: false
//       },
//       order: Number
//     }],
//     specifications: {
//       bedrooms: {
//         type: Number,
//         default: 0
//       },
//       bathrooms: {
//         type: Number,
//         default: 0
//       },
//       maxGuests: {
//         type: Number,
//         default: 1
//       },
//       squareFeet: {
//         type: Number,
//         default: 0
//       }
//     },
//     amenities: [{
//       type: String
//     }],
//     status: {
//       type: String,
//       enum: ['active', 'inactive', 'pending', 'draft'],
//       default: 'draft'
//     },
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     rating: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5
//     },
//     totalBookings: {
//       type: Number,
//       default: 0
//     },
//     isFeatured: {
//       type: Boolean,
//       default: false
//     },
//     availability: {
//       startDate: Date,
//       endDate: Date,
//       isAvailable: {
//         type: Boolean,
//         default: true
//       }
//     }
//   },
//   { 
//     timestamps: true 
//   }
// );

// // Index for better query performance
// propertySchema.index({ location: 'text', title: 'text' });
// propertySchema.index({ status: 1, isFeatured: 1 });
// propertySchema.index({ owner: 1 });

// module.exports = mongoose.model("Property", propertySchema);

