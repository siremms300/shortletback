// controllers/userController.js
const User = require("../Models/UserModel");
const emailService = require("../Services/emailService");

const userController = {
  /* UPLOAD DOCUMENT FOR VERIFICATION */
  // uploadDocument: async (req, res) => {
  //   try {
  //     const { userId } = req.params;
  //     const { documentType, documentNumber } = req.body;
  //     const documentFile = req.file;

  //     if (!documentFile) {
  //       return res.status(400).json({ message: "No document file uploaded" });
  //     }

  //     const user = await User.findById(userId);
  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //     }

  //     // Check if document type already exists
  //     const existingDoc = user.documents.find(doc => 
  //       doc.documentType === documentType && doc.status !== 'rejected'
  //     );

  //     if (existingDoc) {
  //       return res.status(400).json({ 
  //         message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
  //       });
  //     }

  //     // Add document to user's documents array
  //     user.documents.push({
  //       documentType,
  //       documentNumber,
  //       documentPath: documentFile.path,
  //       status: 'pending'
  //     });

  //     // Update verification status
  //     user.updateVerificationStatus();

  //     await user.save();

  //     const updatedUser = await User.findById(userId).select("-password -refreshTokens");

  //     // Send email notification to admin (don't await to avoid blocking response)
  //     emailService.sendDocumentUploadNotification(user, documentType)
  //       .catch(error => console.error('Error sending upload notification:', error));

  //     res.status(200).json({
  //       message: "Document uploaded successfully and is under review",
  //       user: updatedUser
  //     });

  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({ error: err.message });
  //   }
  // },

  // In userController.js - update uploadDocument and updateProfile functions

// uploadDocument: async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { documentType, documentNumber } = req.body;
//     const documentFile = req.file;

//     if (!documentFile) {
//       return res.status(400).json({ message: "No document file uploaded" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Handle Vercel vs local file storage
//     let documentPath;
//     if (process.env.VERCEL && documentFile.isVercel) {
//       // On Vercel: File is in memory
//       console.log('Vercel document upload - storing in memory');
//       documentPath = `/uploads/users/${documentFile.filename}`;
//       // In production, upload to cloud storage here
//     } else {
//       // Local: File is saved to disk
//       documentPath = documentFile.path;
//     }

//     // Check if document type already exists
//     const existingDoc = user.documents.find(doc => 
//       doc.documentType === documentType && doc.status !== 'rejected'
//     );

//     if (existingDoc) {
//       return res.status(400).json({ 
//         message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
//       });
//     }

//     // Add document to user's documents array
//     user.documents.push({
//       documentType,
//       documentNumber,
//       documentPath,
//       status: 'pending'
//     });

//     // Update verification status
//     user.updateVerificationStatus();

//     await user.save();

//     const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//     // Send email notification to admin
//     emailService.sendDocumentUploadNotification(user, documentType)
//       .catch(error => console.error('Error sending upload notification:', error));

//     res.status(200).json({
//       message: "Document uploaded successfully and is under review",
//       user: updatedUser
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err.message });
//   }
// },

// updateProfile: async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
//     const profileImage = req.file;
//     const userId = req.params.userId;

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if email is being changed and if it's already taken
//     if (email !== user.email) {
//       const existingUser = await User.findOne({ email });
//       if (existingUser && existingUser._id.toString() !== userId) {
//         return res.status(400).json({ message: "Email already exists" });
//       }
//     }

//     // Update fields
//     const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
    
//     if (profileImage) {
//       // Handle Vercel vs local
//       if (process.env.VERCEL && profileImage.isVercel) {
//         updateData.profileImagePath = `/uploads/users/${profileImage.filename}`;
//       } else {
//         updateData.profileImagePath = profileImage.path;
//       }
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       { new: true, runValidators: true }
//     ).select("-password -refreshTokens");

//     res.status(200).json({
//       message: "Profile updated successfully",
//       user: updatedUser
//     });

//   } catch (err) {
//     console.log(err);
//     if (err.code === 11000) {
//       return res.status(400).json({ message: "Email already exists" });
//     }
//     res.status(500).json({ error: err.message });
//   }
// },


// In userController.js - update uploadDocument function
  uploadDocument: async (req, res) => {
    try {
      const { userId } = req.params;
      const { documentType, documentNumber } = req.body;
      const documentFile = req.file;

      if (!documentFile) {
        return res.status(400).json({ message: "No document file uploaded" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get URL from Cloudinary or fallback to path
      const documentUrl = documentFile.cloudinary?.url || documentFile.path;
      
      console.log('Processing document upload:', {
        originalName: documentFile.originalname,
        cloudinaryUrl: documentFile.cloudinary?.url,
        localPath: documentFile.path,
        finalUrl: documentUrl
      });

      // Check if document type already exists
      const existingDoc = user.documents.find(doc => 
        doc.documentType === documentType && doc.status !== 'rejected'
      );

      if (existingDoc) {
        return res.status(400).json({ 
          message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
        });
      }

      // Add document to user's documents array with Cloudinary URL
      user.documents.push({
        documentType,
        documentNumber,
        documentPath: documentUrl,
        status: 'pending'
      });

      // Update verification status
      user.updateVerificationStatus();

      await user.save();

      const updatedUser = await User.findById(userId).select("-password -refreshTokens");

      // Send email notification to admin
      emailService.sendDocumentUploadNotification(user, documentType)
        .catch(error => console.error('Error sending upload notification:', error));

      res.status(200).json({
        message: "Document uploaded successfully and is under review",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  // Update updateProfile function
  updateProfile: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
      const profileImage = req.file;
      const userId = req.params.userId;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is being changed and if it's already taken
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Update fields
      const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
      
      if (profileImage) {
        // Get URL from Cloudinary or fallback to path
        const profileImageUrl = profileImage.cloudinary?.url || profileImage.path;
        
        console.log('Updating profile image:', {
          originalName: profileImage.originalname,
          cloudinaryUrl: profileImage.cloudinary?.url,
          finalUrl: profileImageUrl
        });
        
        updateData.profileImagePath = profileImageUrl;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password -refreshTokens");

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      if (err.code === 11000) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  },

  /* VERIFY/APPROVE DOCUMENT (Admin only) */
  verifyDocument: async (req, res) => {
    try {
      const { documentId } = req.params;

      const user = await User.findOne({ "documents._id": documentId });
      if (!user) {
        return res.status(404).json({ message: "Document not found" });
      }

      const document = user.documents.id(documentId);
      document.status = 'approved';
      document.verifiedAt = new Date();
      document.verifiedBy = req.user.id;

      // Update user verification status
      user.updateVerificationStatus();

      await user.save();

      const updatedUser = await User.findById(user._id)
        .select("-password -refreshTokens")
        .populate('documents.verifiedBy', 'firstName lastName');

      // Send approval email to user (don't await to avoid blocking response)
      emailService.sendDocumentApprovedNotification(user, document.documentType)
        .catch(error => console.error('Error sending approval notification:', error));

      res.status(200).json({
        message: "Document approved successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },
 
  /* REJECT DOCUMENT (Admin only) */
  rejectDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const user = await User.findOne({ "documents._id": documentId });
      if (!user) {
        return res.status(404).json({ message: "Document not found" });
      }

      const document = user.documents.id(documentId);
      document.status = 'rejected';
      document.rejectionReason = rejectionReason;
      document.rejectedAt = new Date();
      document.rejectedBy = req.user.id;

      // Update user verification status
      user.updateVerificationStatus();

      await user.save();

      const updatedUser = await User.findById(user._id)
        .select("-password -refreshTokens")
        .populate('documents.verifiedBy', 'firstName lastName');

      // Send rejection email to user (don't await to avoid blocking response)
      emailService.sendDocumentRejectedNotification(user, document.documentType, rejectionReason)
        .catch(error => console.error('Error sending rejection notification:', error));

      res.status(200).json({
        message: "Document rejected successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* GET USER DOCUMENTS */
  getDocuments: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select("documents verificationStatus")
        .populate('documents.verifiedBy', 'firstName lastName');

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user.documents);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* UPDATE USER PROFILE */
  // updateProfile: async (req, res) => {
  //   try {
  //     const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
  //     const profileImage = req.file;
  //     const userId = req.params.userId;

  //     // Check if user exists
  //     const user = await User.findById(userId);
  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //     }

  //     // Check if email is being changed and if it's already taken
  //     if (email !== user.email) {
  //       const existingUser = await User.findOne({ email });
  //       if (existingUser && existingUser._id.toString() !== userId) {
  //         return res.status(400).json({ message: "Email already exists" });
  //       }
  //     }

  //     // Update fields
  //     const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
      
  //     if (profileImage) {
  //       updateData.profileImagePath = profileImage.path;
  //     }

  //     const updatedUser = await User.findByIdAndUpdate(
  //       userId,
  //       updateData,
  //       { new: true, runValidators: true }
  //     ).select("-password -refreshTokens");

  //     res.status(200).json({
  //       message: "Profile updated successfully",
  //       user: updatedUser
  //     });

  //   } catch (err) {
  //     console.log(err);
  //     if (err.code === 11000) {
  //       return res.status(400).json({ message: "Email already exists" });
  //     }
  //     res.status(500).json({ error: err.message });
  //   }
  // },

  /* GET USER PROFILE */
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select("-password -refreshTokens");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  // ===== ADMIN CONTROLLERS =====

  /* GET ALL USERS (Admin only) */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find()
        .select("-password -refreshTokens")
        .sort({ createdAt: -1 });

      res.status(200).json(users);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* GET USER BY ID (Admin only) */
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select("-password -refreshTokens")
        .populate('documents.verifiedBy', 'firstName lastName');

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* UPDATE USER (Admin only) */
  updateUser: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, role, isActive } = req.body;
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (role) updateData.role = role;
      if (typeof isActive !== 'undefined') updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password -refreshTokens");

      res.status(200).json({
        message: "User updated successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      if (err.code === 11000) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  },

  /* DELETE USER (Admin only) */
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await User.findByIdAndDelete(userId);

      res.status(200).json({
        message: "User deleted successfully"
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* VERIFY USER (Admin only) */
  verifyUser: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verifiedBy = req.user.id;

      await user.save();

      const updatedUser = await User.findById(userId).select("-password -refreshTokens");

      res.status(200).json({
        message: "User verified successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* SUSPEND USER (Admin only) */
  suspendUser: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = false;
      user.suspendedAt = new Date();
      user.suspendedBy = req.user.id;

      await user.save();

      const updatedUser = await User.findById(userId).select("-password -refreshTokens");

      res.status(200).json({
        message: "User suspended successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* ACTIVATE USER (Admin only) */
  activateUser: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = true;
      user.suspendedAt = undefined;
      user.suspendedBy = undefined;

      await user.save();

      const updatedUser = await User.findById(userId).select("-password -refreshTokens");

      res.status(200).json({
        message: "User activated successfully",
        user: updatedUser
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = userController;






































































// // controllers/userController.js
// const User = require("../Models/UserModel");
// const emailService = require("../Services/emailService"); // Add this line

// const userController = {
//   /* UPLOAD DOCUMENT FOR VERIFICATION */
//   // uploadDocument: async (req, res) => {
//   //   try {
//   //     const { userId } = req.params;
//   //     const { documentType, documentNumber } = req.body;
//   //     const documentFile = req.file;

//   //     if (!documentFile) {
//   //       return res.status(400).json({ message: "No document file uploaded" });
//   //     }

//   //     const user = await User.findById(userId);
//   //     if (!user) {
//   //       return res.status(404).json({ message: "User not found" });
//   //     }

//   //     // Check if document type already exists
//   //     const existingDoc = user.documents.find(doc => 
//   //       doc.documentType === documentType && doc.status !== 'rejected'
//   //     );

//   //     if (existingDoc) {
//   //       return res.status(400).json({ 
//   //         message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
//   //       });
//   //     }

//   //     // Add document to user's documents array
//   //     user.documents.push({
//   //       documentType,
//   //       documentNumber,
//   //       documentPath: documentFile.path,
//   //       status: 'pending'
//   //     });

//   //     // Update verification status
//   //     user.updateVerificationStatus();

//   //     await user.save();

//   //     const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//   //     res.status(200).json({
//   //       message: "Document uploaded successfully and is under review",
//   //       user: updatedUser
//   //     });

//   //   } catch (err) {
//   //     console.log(err);
//   //     res.status(500).json({ error: err.message });
//   //   }
//   // },

//    uploadDocument: async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { documentType, documentNumber } = req.body;
//       const documentFile = req.file;

//       if (!documentFile) {
//         return res.status(400).json({ message: "No document file uploaded" });
//       }

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Check if document type already exists
//       const existingDoc = user.documents.find(doc => 
//         doc.documentType === documentType && doc.status !== 'rejected'
//       );

//       if (existingDoc) {
//         return res.status(400).json({ 
//           message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
//         });
//       }

//       // Add document to user's documents array
//       user.documents.push({
//         documentType,
//         documentNumber,
//         documentPath: documentFile.path,
//         status: 'pending'
//       });

//       // Update verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//       // Send email notification to admin
//       await emailService.sendDocumentUploadNotification(user, documentType);

//       res.status(200).json({
//         message: "Document uploaded successfully and is under review",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   verifyDocument: async (req, res) => {
//     try {
//       const { documentId } = req.params;

//       const user = await User.findOne({ "documents._id": documentId });
//       if (!user) {
//         return res.status(404).json({ message: "Document not found" });
//       }

//       const document = user.documents.id(documentId);
//       document.status = 'approved';
//       document.verifiedAt = new Date();
//       document.verifiedBy = req.user.id;

//       // Update user verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(user._id)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       // Send approval email to user
//       await emailService.sendDocumentApprovedNotification(user, document.documentType);

//       res.status(200).json({
//         message: "Document approved successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* REJECT DOCUMENT (Admin only) */
//   rejectDocument: async (req, res) => {
//     try {
//       const { documentId } = req.params;
//       const { rejectionReason } = req.body;

//       const user = await User.findOne({ "documents._id": documentId });
//       if (!user) {
//         return res.status(404).json({ message: "Document not found" });
//       }

//       const document = user.documents.id(documentId);
//       document.status = 'rejected';
//       document.rejectionReason = rejectionReason;
//       document.rejectedAt = new Date();
//       document.rejectedBy = req.user.id;

//       // Update user verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(user._id)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       // Send rejection email to user
//       await emailService.sendDocumentRejectedNotification(user, document.documentType, rejectionReason);

//       res.status(200).json({
//         message: "Document rejected successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* GET USER DOCUMENTS */
//   getDocuments: async (req, res) => {
//     try {
//       const user = await User.findById(req.params.userId)
//         .select("documents verificationStatus")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       res.status(200).json(user.documents);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* UPDATE USER PROFILE */
//   updateProfile: async (req, res) => {
//     try {
//       const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
//       const profileImage = req.file;
//       const userId = req.params.userId;

//       // Check if user exists
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Check if email is being changed and if it's already taken
//       if (email !== user.email) {
//         const existingUser = await User.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== userId) {
//           return res.status(400).json({ message: "Email already exists" });
//         }
//       }

//       // Update fields
//       const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
      
//       if (profileImage) {
//         updateData.profileImagePath = profileImage.path;
//       }

//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         updateData,
//         { new: true, runValidators: true }
//       ).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "Profile updated successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       if (err.code === 11000) {
//         return res.status(400).json({ message: "Email already exists" });
//       }
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* GET USER PROFILE */
//   getProfile: async (req, res) => {
//     try {
//       const user = await User.findById(req.params.userId).select("-password -refreshTokens");
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//       res.status(200).json(user);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   // ===== ADMIN CONTROLLERS =====

//   /* GET ALL USERS (Admin only) */
//   getAllUsers: async (req, res) => {
//     try {
//       const users = await User.find()
//         .select("-password -refreshTokens")
//         .sort({ createdAt: -1 });

//       res.status(200).json(users);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* GET USER BY ID (Admin only) */
//   getUserById: async (req, res) => {
//     try {
//       const user = await User.findById(req.params.userId)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       res.status(200).json(user);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* UPDATE USER (Admin only) */
//   updateUser: async (req, res) => {
//     try {
//       const { firstName, lastName, email, phone, role, isActive } = req.body;
//       const userId = req.params.userId;

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Check if email is being changed and if it's already taken
//       if (email && email !== user.email) {
//         const existingUser = await User.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== userId) {
//           return res.status(400).json({ message: "Email already exists" });
//         }
//       }

//       const updateData = {};
//       if (firstName) updateData.firstName = firstName;
//       if (lastName) updateData.lastName = lastName;
//       if (email) updateData.email = email;
//       if (phone) updateData.phone = phone;
//       if (role) updateData.role = role;
//       if (typeof isActive !== 'undefined') updateData.isActive = isActive;

//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         updateData,
//         { new: true, runValidators: true }
//       ).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "User updated successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       if (err.code === 11000) {
//         return res.status(400).json({ message: "Email already exists" });
//       }
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* DELETE USER (Admin only) */
//   deleteUser: async (req, res) => {
//     try {
//       const userId = req.params.userId;

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Prevent admin from deleting themselves
//       if (user._id.toString() === req.user.id) {
//         return res.status(400).json({ message: "Cannot delete your own account" });
//       }

//       await User.findByIdAndDelete(userId);

//       res.status(200).json({
//         message: "User deleted successfully"
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* VERIFY USER (Admin only) */
//   verifyUser: async (req, res) => {
//     try {
//       const userId = req.params.userId;

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       user.isVerified = true;
//       user.verifiedAt = new Date();
//       user.verifiedBy = req.user.id;

//       await user.save();

//       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "User verified successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* SUSPEND USER (Admin only) */
//   suspendUser: async (req, res) => {
//     try {
//       const userId = req.params.userId;

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       user.isActive = false;
//       user.suspendedAt = new Date();
//       user.suspendedBy = req.user.id;

//       await user.save();

//       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "User suspended successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* ACTIVATE USER (Admin only) */
//   activateUser: async (req, res) => {
//     try {
//       const userId = req.params.userId;

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       user.isActive = true;
//       user.suspendedAt = undefined;
//       user.suspendedBy = undefined;

//       await user.save();

//       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "User activated successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* VERIFY DOCUMENT (Admin only) */
//   verifyDocument: async (req, res) => {
//     try {
//       const { documentId } = req.params;

//       const user = await User.findOne({ "documents._id": documentId });
//       if (!user) {
//         return res.status(404).json({ message: "Document not found" });
//       }

//       const document = user.documents.id(documentId);
//       document.status = 'verified';
//       document.verifiedAt = new Date();
//       document.verifiedBy = req.user.id;

//       // Update user verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(user._id)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       res.status(200).json({
//         message: "Document verified successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* REJECT DOCUMENT (Admin only) */
//   rejectDocument: async (req, res) => {
//     try {
//       const { documentId } = req.params;
//       const { rejectionReason } = req.body;

//       const user = await User.findOne({ "documents._id": documentId });
//       if (!user) {
//         return res.status(404).json({ message: "Document not found" });
//       }

//       const document = user.documents.id(documentId);
//       document.status = 'rejected';
//       document.rejectionReason = rejectionReason;
//       document.rejectedAt = new Date();
//       document.rejectedBy = req.user.id;

//       // Update user verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(user._id)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       res.status(200).json({
//         message: "Document rejected successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

 
//   // approveDocument: async (req, res) => {
//   //   try {
//   //     const { documentId } = req.params;

//   //     const user = await User.findOne({ "documents._id": documentId });
//   //     if (!user) {
//   //       return res.status(404).json({ message: "Document not found" });
//   //     }

//   //     const document = user.documents.id(documentId);
//   //     document.status = 'approved';
//   //     document.verifiedAt = new Date();
//   //     document.verifiedBy = req.user.id;

//   //     // Update user verification status
//   //     user.updateVerificationStatus();

//   //     await user.save();

//   //     const updatedUser = await User.findById(user._id)
//   //       .select("-password -refreshTokens")
//   //       .populate('documents.verifiedBy', 'firstName lastName');

//   //     res.status(200).json({
//   //       message: "Document approved successfully",
//   //       user: updatedUser
//   //     });

//   //   } catch (err) {
//   //     console.log(err);
//   //     res.status(500).json({ error: err.message });
//   //   }
//   // },
 
//   verifyDocument: async (req, res) => {
//     try {
//       const { documentId } = req.params;

//       const user = await User.findOne({ "documents._id": documentId });
//       if (!user) {
//         return res.status(404).json({ message: "Document not found" });
//       }

//       const document = user.documents.id(documentId);
//       document.status = 'approved'; // Changed from 'verified' to 'approved'
//       document.verifiedAt = new Date();
//       document.verifiedBy = req.user.id;

//       // Update user verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(user._id)
//         .select("-password -refreshTokens")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       res.status(200).json({
//         message: "Document approved successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },


// };

// module.exports = userController;






















 



















































// // controllers/userController.js
// const User = require("../Models/UserModel");

// const userController = {
//   /* UPLOAD DOCUMENT FOR VERIFICATION */
//   uploadDocument: async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { documentType, documentNumber } = req.body;
//       const documentFile = req.file;

//       if (!documentFile) {
//         return res.status(400).json({ message: "No document file uploaded" });
//       }

//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Check if document type already exists
//       const existingDoc = user.documents.find(doc => 
//         doc.documentType === documentType && doc.status !== 'rejected'
//       );

//       if (existingDoc) {
//         return res.status(400).json({ 
//           message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
//         });
//       }

//       // Add document to user's documents array - FIXED FIELD NAME
//       user.documents.push({
//         documentType,
//         documentNumber,
//         documentPath: documentFile.path, // CHANGED FROM documentImagePath TO documentPath
//         status: 'pending'
//       });

//       // Update verification status
//       user.updateVerificationStatus();

//       await user.save();

//       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "Document uploaded successfully and is under review",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* GET USER DOCUMENTS */
//   getDocuments: async (req, res) => {
//     try {
//       const user = await User.findById(req.params.userId)
//         .select("documents verificationStatus")
//         .populate('documents.verifiedBy', 'firstName lastName');

//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       res.status(200).json(user);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* UPDATE USER PROFILE */
//   updateProfile: async (req, res) => {
//     try {
//       const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
//       const profileImage = req.file;
//       const userId = req.params.userId;

//       // Check if user exists
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }

//       // Check if email is being changed and if it's already taken
//       if (email !== user.email) {
//         const existingUser = await User.findOne({ email });
//         if (existingUser && existingUser._id.toString() !== userId) {
//           return res.status(400).json({ message: "Email already exists" });
//         }
//       }

//       // Update fields
//       const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
      
//       if (profileImage) {
//         updateData.profileImagePath = profileImage.path;
//       }

//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         updateData,
//         { new: true, runValidators: true }
//       ).select("-password -refreshTokens");

//       res.status(200).json({
//         message: "Profile updated successfully",
//         user: updatedUser
//       });

//     } catch (err) {
//       console.log(err);
//       if (err.code === 11000) {
//         return res.status(400).json({ message: "Email already exists" });
//       }
//       res.status(500).json({ error: err.message });
//     }
//   },

//   /* GET USER PROFILE */
//   getProfile: async (req, res) => {
//     try {
//       const user = await User.findById(req.params.userId).select("-password -refreshTokens");
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//       res.status(200).json(user);
//     } catch (err) {
//       console.log(err);
//       res.status(500).json({ error: err.message });
//     }
//   }
// };

// module.exports = userController;








































// // // controllers/userController.js
// // const User = require("../Models/UserModel");

// // const userController = {
// //   /* UPLOAD DOCUMENT FOR VERIFICATION */
// //   uploadDocument: async (req, res) => {
// //     try {
// //       const { userId } = req.params;
// //       const { documentType, documentNumber } = req.body;
// //       const documentFile = req.file;

// //       if (!documentFile) {
// //         return res.status(400).json({ message: "No document file uploaded" });
// //       }

// //       const user = await User.findById(userId);
// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }

// //       // Check if document type already exists
// //       const existingDoc = user.documents.find(doc => 
// //         doc.documentType === documentType && doc.status !== 'rejected'
// //       );

// //       if (existingDoc) {
// //         return res.status(400).json({ 
// //           message: `You already have a ${documentType} document uploaded. Please wait for review or contact support.` 
// //         });
// //       }

// //       // Add document to user's documents array
// //       user.documents.push({
// //         documentType,
// //         documentNumber,
// //         documentImagePath: documentFile.path,
// //         status: 'pending'
// //       });

// //       // Update verification status
// //       user.updateVerificationStatus();

// //       await user.save();

// //       const updatedUser = await User.findById(userId).select("-password -refreshTokens");

// //       res.status(200).json({
// //         message: "Document uploaded successfully and is under review",
// //         user: updatedUser
// //       });

// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   },

// //   /* GET USER DOCUMENTS */
// //   getDocuments: async (req, res) => {
// //     try {
// //       const user = await User.findById(req.params.userId)
// //         .select("documents verificationStatus")
// //         .populate('documents.verifiedBy', 'firstName lastName');

// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }

// //       res.status(200).json(user);
// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   },

// //   /* UPDATE USER PROFILE */
// //   updateProfile: async (req, res) => {
// //     try {
// //       const { firstName, lastName, email, phone, dateOfBirth, bio } = req.body;
// //       const profileImage = req.file;
// //       const userId = req.params.userId;

// //       // Check if user exists
// //       const user = await User.findById(userId);
// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }

// //       // Check if email is being changed and if it's already taken
// //       if (email !== user.email) {
// //         const existingUser = await User.findOne({ email });
// //         if (existingUser && existingUser._id.toString() !== userId) {
// //           return res.status(400).json({ message: "Email already exists" });
// //         }
// //       }

// //       // Update fields
// //       const updateData = { firstName, lastName, email, phone, dateOfBirth, bio };
      
// //       if (profileImage) {
// //         updateData.profileImagePath = profileImage.path;
// //       }

// //       const updatedUser = await User.findByIdAndUpdate(
// //         userId,
// //         updateData,
// //         { new: true, runValidators: true }
// //       ).select("-password -refreshTokens");

// //       res.status(200).json({
// //         message: "Profile updated successfully",
// //         user: updatedUser
// //       });

// //     } catch (err) {
// //       console.log(err);
// //       if (err.code === 11000) {
// //         return res.status(400).json({ message: "Email already exists" });
// //       }
// //       res.status(500).json({ error: err.message });
// //     }
// //   },

// //   /* GET USER PROFILE */
// //   getProfile: async (req, res) => {
// //     try {
// //       const user = await User.findById(req.params.userId).select("-password -refreshTokens");
// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }
// //       res.status(200).json(user);
// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   }
// // };

// // module.exports = userController;



































// // // controllers/userController.js
// // const User = require("../Models/UserModel");

// // const userController = {
// //   /* UPLOAD DOCUMENT FOR VERIFICATION */
// //   uploadDocument: async (req, res) => {
// //     try {
// //       const { userId } = req.params;
// //       const { documentType } = req.body;
// //       const documentFile = req.file;

// //       if (!documentFile) {
// //         return res.status(400).json({ message: "No document file uploaded" });
// //       }

// //       const user = await User.findById(userId);
// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }

// //       // Add document to user's documents array
// //       user.documents.push({
// //         documentType,
// //         documentPath: documentFile.path,
// //         status: "pending"
// //       });

// //       await user.save();

// //       res.status(200).json({
// //         message: "Document uploaded successfully",
// //         documents: user.documents
// //       });

// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   },

// //   /* GET USER PROFILE */
// //   getProfile: async (req, res) => {
// //     try {
// //       const user = await User.findById(req.params.userId).select("-password");
// //       if (!user) {
// //         return res.status(404).json({ message: "User not found" });
// //       }
// //       res.status(200).json(user);
// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   },

// //   /* UPDATE USER PROFILE */
// //   updateProfile: async (req, res) => {
// //     try {
// //       const { firstName, lastName } = req.body;
// //       const profileImage = req.file;

// //       const updateData = { firstName, lastName };
      
// //       if (profileImage) {
// //         updateData.profileImagePath = profileImage.path;
// //       }

// //       const user = await User.findByIdAndUpdate(
// //         req.params.userId,
// //         updateData,
// //         { new: true }
// //       ).select("-password");

// //       res.status(200).json({
// //         message: "Profile updated successfully",
// //         user
// //       });

// //     } catch (err) {
// //       console.log(err);
// //       res.status(500).json({ error: err.message });
// //     }
// //   }
// // };

// // module.exports = userController; 

