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
    timestamps: true 
  }
);

// Index for better query performance
propertySchema.index({ location: 'text', title: 'text' });
propertySchema.index({ status: 1, isFeatured: 1 });
propertySchema.index({ owner: 1 });

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

