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
    // Discount fields
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: null
      },
      value: {
        type: Number,
        min: 0,
        default: 0
      },
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    // Original price before discount (for reference)
    originalPrice: {
      type: Number
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

// Virtual for discounted price
propertySchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.isActive) {
    return this.price;
  }
  
  // Check if discount is within date range
  const now = new Date();
  if (this.discount.startDate && now < new Date(this.discount.startDate)) {
    return this.price;
  }
  if (this.discount.endDate && now > new Date(this.discount.endDate)) {
    return this.price;
  }
  
  if (this.discount.type === 'percentage') {
    return this.price - (this.price * this.discount.value / 100);
  } else if (this.discount.type === 'fixed') {
    return Math.max(0, this.price - this.discount.value);
  }
  
  return this.price;
});

// Virtual for discount percentage
propertySchema.virtual('discountPercentage').get(function() {
  if (!this.discount || !this.discount.isActive || this.discountedPrice >= this.price) {
    return 0;
  }
  
  return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
});

// Method to check if discount is active
propertySchema.methods.isDiscountActive = function() {
  if (!this.discount || !this.discount.isActive) {
    return false;
  }
  
  const now = new Date();
  if (this.discount.startDate && now < new Date(this.discount.startDate)) {
    return false;
  }
  if (this.discount.endDate && now > new Date(this.discount.endDate)) {
    return false;
  }
  
  return true;
};

// Update price breakdown virtual to use discounted price
propertySchema.virtual('priceBreakdown').get(function() {
  const actualPrice = this.isDiscountActive() ? this.discountedPrice : this.price;
  const originalPrice = this.price;
  const utilityPercentage = this.utilityPercentage || 20;
  const serviceChargePercentage = this.serviceChargePercentage || 10;
  const vatPercentage = this.vatPercentage || 7.5;
  
  const utility = (actualPrice * utilityPercentage) / 100;
  const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
  const accommodation = actualPrice - utility - serviceCharge;
  const vat = (accommodation * vatPercentage) / 100;
  const total = actualPrice + vat;
  
  return {
    originalPrice,
    actualPrice,
    utilityPercentage,
    utility,
    serviceChargePercentage,
    serviceCharge,
    accommodation,
    vatPercentage,
    vat,
    total,
    hasDiscount: this.isDiscountActive(),
    discountPercentage: this.discountPercentage,
    discountType: this.discount?.type,
    discountValue: this.discount?.value
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
      this.isModified('discount') ||
      this.isModified('utilityPercentage') || 
      this.isModified('serviceChargePercentage') || 
      this.isModified('vatPercentage')) {
    this.calculatePrices();
    
    // Store original price if discount is added
    if (this.discount && this.discount.isActive && !this.originalPrice) {
      this.originalPrice = this.price;
    }
  }
  next();
});

// Index for better query performance
propertySchema.index({ location: 'text', title: 'text' });
propertySchema.index({ status: 1, isFeatured: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ 'discount.isActive': 1 });

module.exports = mongoose.model("Property", propertySchema);






















































































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
//     // Add these new fields
//     utilityPercentage: {
//       type: Number,
//       default: 20,
//       min: 0,
//       max: 100
//     },
//     serviceChargePercentage: {
//       type: Number,
//       default: 10,
//       min: 0,
//       max: 100
//     },
//     vatPercentage: {
//       type: Number,
//       default: 7.5,
//       min: 0,
//       max: 100
//     },
//     // Virtual fields for calculated prices
//     calculatedPrices: {
//       type: Object,
//       default: {}
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
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
//   }
// );

// // Add virtual getter for calculated prices
// // propertySchema.virtual('priceBreakdown').get(function() {
// //   const actualPrice = this.price;
// //   const utility = (actualPrice * this.utilityPercentage) / 100;
// //   const serviceCharge = (actualPrice * this.serviceChargePercentage) / 100;
// //   const accommodation = actualPrice - utility - serviceCharge;
// //   const vat = (accommodation * this.vatPercentage) / 100;
// //   const total = actualPrice + vat;
  
// //   return {
// //     actualPrice,
// //     utilityPercentage: this.utilityPercentage,
// //     utility,
// //     serviceChargePercentage: this.serviceChargePercentage,
// //     serviceCharge,
// //     accommodation,
// //     vatPercentage: this.vatPercentage,
// //     vat,
// //     total
// //   };
// // });

// // propertySchema.virtual('priceBreakdown').get(function() {
// //   const actualPrice = this.price;
// //   const utility = (actualPrice * this.utilityPercentage) / 100;
// //   const serviceCharge = (actualPrice * this.serviceChargePercentage) / 100;
// //   const accommodation = actualPrice - utility - serviceCharge;
// //   const vat = (accommodation * this.vatPercentage) / 100;
// //   const total = actualPrice + vat;  // CORRECT: Actual + VAT on Accommodation
  
// //   return {
// //     actualPrice,
// //     utilityPercentage: this.utilityPercentage,
// //     utility,
// //     serviceChargePercentage: this.serviceChargePercentage,
// //     serviceCharge,
// //     accommodation,
// //     vatPercentage: this.vatPercentage,
// //     vat,
// //     total  // This is the total per night
// //   };
// // });

// propertySchema.virtual('priceBreakdown').get(function() {
//   const actualPrice = this.price;
//   const utilityPercentage = this.utilityPercentage || 20;
//   const serviceChargePercentage = this.serviceChargePercentage || 10;
//   const vatPercentage = this.vatPercentage || 7.5;
  
//   const utility = (actualPrice * utilityPercentage) / 100;
//   const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
//   const accommodation = actualPrice - utility - serviceCharge;
//   const vat = (accommodation * vatPercentage) / 100;
//   const total = actualPrice + vat; // Actual price + VAT on accommodation
  
//   return {
//     actualPrice,
//     utilityPercentage,
//     utility,
//     serviceChargePercentage,
//     serviceCharge,
//     accommodation,
//     vatPercentage,
//     vat,
//     total
//   };
// });

// // Method to update calculated prices
// propertySchema.methods.calculatePrices = function() {
//   const breakdown = this.priceBreakdown;
//   this.calculatedPrices = breakdown;
//   return breakdown;
// };

// // Middleware to update calculated prices before saving
// propertySchema.pre('save', function(next) {
//   if (this.isModified('price') || 
//       this.isModified('utilityPercentage') || 
//       this.isModified('serviceChargePercentage') || 
//       this.isModified('vatPercentage')) {
//     this.calculatePrices();
//   }
//   next();
// });

// // Index for better query performance
// propertySchema.index({ location: 'text', title: 'text' });
// propertySchema.index({ status: 1, isFeatured: 1 });
// propertySchema.index({ owner: 1 });

// module.exports = mongoose.model("Property", propertySchema);














































































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

