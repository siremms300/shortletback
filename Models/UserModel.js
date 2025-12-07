// models/User.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: ['nin', 'passport', 'drivers_license', 'voters_card', 'utility_bill', 'other']
  },
  documentNumber: {
    type: String,
    required: true
  },
  documentPath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    profileImagePath: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    documents: [documentSchema],
    refreshTokens: [{
      token: String,
      expiresAt: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspendedAt: Date,
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    tripList: {
      type: Array,
      default: [],
    },
    wishList: {
      type: Array,
      default: [],
    },
    propertyList: {
      type: Array,
      default: [],
    },
    reservationList: {
      type: Array,
      default: [],
    },
    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

// Update verification status based on documents
UserSchema.methods.updateVerificationStatus = function() {
  const approvedDocs = this.documents.filter(doc => doc.status === 'approved');
  const rejectedDocs = this.documents.filter(doc => doc.status === 'rejected');
  const pendingDocs = this.documents.filter(doc => doc.status === 'pending' || doc.status === 'under_review');

  if (approvedDocs.length >= 1) {
    this.verificationStatus = 'verified';
    this.isVerified = true;
  } else if (rejectedDocs.length > 0 && pendingDocs.length === 0) {
    this.verificationStatus = 'rejected';
    this.isVerified = false;
  } else if (pendingDocs.length > 0) {
    this.verificationStatus = 'pending';
    this.isVerified = false;
  } else {
    this.verificationStatus = 'unverified';
    this.isVerified = false;
  }
};

// Method to clean expired refresh tokens
UserSchema.methods.cleanExpiredRefreshTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    tokenData => tokenData.expiresAt > new Date()
  );
};

// Update last login timestamp
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);



































// // models/User.js
// const mongoose = require("mongoose");

// const documentSchema = new mongoose.Schema({
//   documentType: {
//     type: String,
//     required: true,
//     enum: ['nin', 'passport', 'drivers_license', 'voters_card', 'utility_bill', 'other']
//   },
//   documentNumber: {
//     type: String,
//     required: true
//   },
//   documentPath: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected', 'under_review'],
//     default: 'pending'
//   },
//   verifiedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   verifiedAt: Date,
//   rejectionReason: String,
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   },
//   expiresAt: Date
// });

// const UserSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ["user", "staff", "admin"],
//       default: "user",
//     },
//     phone: {
//       type: String,
//       default: "",
//     },
//     dateOfBirth: {
//       type: String,
//       default: "",
//     },
//     bio: {
//       type: String,
//       default: "",
//     },
//     profileImagePath: {
//       type: String,
//       default: "",
//     },
//     verificationStatus: {
//       type: String,
//       enum: ['unverified', 'pending', 'verified', 'rejected'],
//       default: 'unverified'
//     },
//     documents: [documentSchema], // Single documents field using the schema above
//     refreshTokens: [{
//       token: String,
//       expiresAt: Date,
//       createdAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//     tripList: {
//       type: Array,
//       default: [],
//     },
//     wishList: {
//       type: Array,
//       default: [],
//     },
//     propertyList: {
//       type: Array,
//       default: [],
//     },
//     reservationList: {
//       type: Array,
//       default: [],
//     }
//   },
//   { timestamps: true }
// );

// // Update verification status based on documents
// UserSchema.methods.updateVerificationStatus = function() {
//   const approvedDocs = this.documents.filter(doc => doc.status === 'approved');
//   const rejectedDocs = this.documents.filter(doc => doc.status === 'rejected');
//   const pendingDocs = this.documents.filter(doc => doc.status === 'pending' || doc.status === 'under_review');

//   if (approvedDocs.length >= 1) { // At least one approved document
//     this.verificationStatus = 'verified';
//     this.isVerified = true;
//   } else if (rejectedDocs.length > 0 && pendingDocs.length === 0) {
//     this.verificationStatus = 'rejected';
//     this.isVerified = false;
//   } else if (pendingDocs.length > 0) {
//     this.verificationStatus = 'pending';
//     this.isVerified = false;
//   } else {
//     this.verificationStatus = 'unverified';
//     this.isVerified = false;
//   }
// };

// // Method to clean expired refresh tokens
// UserSchema.methods.cleanExpiredRefreshTokens = function() {
//   this.refreshTokens = this.refreshTokens.filter(
//     tokenData => tokenData.expiresAt > new Date()
//   );
// };

// module.exports = mongoose.model("User", UserSchema);



























































































// // models/User.js
// const mongoose = require("mongoose");

// const documentSchema = new mongoose.Schema({
//   documentType: {
//     type: String,
//     required: true,
//     enum: ['nin', 'passport', 'drivers_license', 'voters_card', 'utility_bill', 'other']
//   },
//   documentNumber: {
//     type: String,
//     required: true
//   },
//   documentImagePath: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected', 'under_review'],
//     default: 'pending'
//   },
//   verifiedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   verifiedAt: Date,
//   rejectionReason: String,
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   },
//   expiresAt: Date
// });

// const UserSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ["user", "staff", "admin"],
//       default: "user",
//     },
//     phone: {
//       type: String,
//       default: "",
//     },
//     dateOfBirth: {
//       type: String,
//       default: "",
//     },
//     bio: {
//       type: String,
//       default: "",
//     },
//     profileImagePath: {
//       type: String,
//       default: "",
//     },
//     verificationStatus: {
//       type: String,
//       enum: ['unverified', 'pending', 'verified', 'rejected'],
//       default: 'unverified'
//     },
//     documents: [documentSchema], 
//     refreshTokens: [{
//       token: String,
//       expiresAt: Date,
//       createdAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     documents: [{
//       documentType: String,
//       documentPath: String,
//       status: {
//         type: String,
//         enum: ["pending", "approved", "rejected"],
//         default: "pending"
//       },
//       uploadedAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//     tripList: {
//       type: Array,
//       default: [],
//     },
//     wishList: {
//       type: Array,
//       default: [],
//     },
//     propertyList: {
//       type: Array,
//       default: [],
//     },
//     reservationList: {
//       type: Array,
//       default: [],
//     }
//   },
 
//   { timestamps: true }
// );

// // Update verification status based on documents
// UserSchema.methods.updateVerificationStatus = function() {
//   const approvedDocs = this.documents.filter(doc => doc.status === 'approved');
//   const rejectedDocs = this.documents.filter(doc => doc.status === 'rejected');
//   const pendingDocs = this.documents.filter(doc => doc.status === 'pending' || doc.status === 'under_review');

//   if (approvedDocs.length >= 1) { // At least one approved document
//     this.verificationStatus = 'verified';
//   } else if (rejectedDocs.length > 0 && pendingDocs.length === 0) {
//     this.verificationStatus = 'rejected';
//   } else if (pendingDocs.length > 0) {
//     this.verificationStatus = 'pending';
//   } else {
//     this.verificationStatus = 'unverified';
//   }
// };
// // Method to clean expired refresh tokens
// UserSchema.methods.cleanExpiredRefreshTokens = function() {
//   this.refreshTokens = this.refreshTokens.filter(
//     tokenData => tokenData.expiresAt > new Date()
//   );
// };
// module.exports = mongoose.model("User", UserSchema);





















































// // models/User.js
// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ["user", "staff", "admin"],
//       default: "user",
//     },
//     profileImagePath: {
//       type: String,
//       default: "",
//     },
//     refreshTokens: [{
//       token: String,
//       expiresAt: Date,
//       createdAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     documents: [{
//       documentType: String,
//       documentPath: String,
//       status: {
//         type: String,
//         enum: ["pending", "approved", "rejected"],
//         default: "pending"
//       },
//       uploadedAt: {
//         type: Date,
//         default: Date.now
//       }
//     }],
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//     tripList: {
//       type: Array,
//       default: [],
//     },
//     wishList: {
//       type: Array,
//       default: [],
//     },
//     propertyList: {
//       type: Array,
//       default: [],
//     },
//     reservationList: {
//       type: Array,
//       default: [],
//     }
//   },
//   { timestamps: true }
// );

// // Method to clean expired refresh tokens
// UserSchema.methods.cleanExpiredRefreshTokens = function() {
//   this.refreshTokens = this.refreshTokens.filter(
//     tokenData => tokenData.expiresAt > new Date()
//   );
// };

// const User = mongoose.model("User", UserSchema);
// module.exports = User;