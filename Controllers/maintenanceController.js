// Controllers/maintenanceController.js
const MaintenanceIssue = require("../Models/MaintenanceModel");
const MaintenanceVendor = require("../Models/MaintenanceVendorModel");

const maintenanceController = {
  // Get all maintenance issues
  getAllIssues: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        priority,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Build filter query
      if (status && status !== 'all') query.status = status;
      if (priority && priority !== 'all') query.priority = priority;
      if (category && category !== 'all') query.category = category;
      if (search) {
        query.$or = [
          { apartment: { $regex: search, $options: 'i' } },
          { unit: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { issueNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const issues = await MaintenanceIssue.find(query)
        .populate('createdBy', 'firstName lastName')
        .populate('assignedToVendor', 'name specialty contact email rating')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await MaintenanceIssue.countDocuments(query);

      res.status(200).json({
        issues,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get maintenance issues error:', error);
      res.status(500).json({
        message: "Failed to fetch maintenance issues",
        error: error.message
      });
    }
  },

  // Get maintenance issue by ID
  getIssueById: async (req, res) => {
    try {
      const { id } = req.params;

      const issue = await MaintenanceIssue.findById(id)
        .populate('createdBy', 'firstName lastName')
        .populate('assignedToVendor', 'name specialty contact email rating responseTime');

      if (!issue) {
        return res.status(404).json({
          message: "Maintenance issue not found"
        });
      }

      res.status(200).json({
        issue
      });

    } catch (error) {
      console.error('Get maintenance issue error:', error);
      res.status(500).json({
        message: "Failed to fetch maintenance issue",
        error: error.message
      });
    }
  },

  // Create new maintenance issue
//   createIssue: async (req, res) => {
//     try {
//       const {
//         apartment,
//         unit,
//         category,
//         priority,
//         description,
//         assignedTo,
//         estimatedCost,
//         estimatedDuration,
//         vendor,
//         warranty,
//         scheduledDate
//       } = req.body;

//       // Validate required fields
//       if (!apartment || !unit || !category || !priority || !description) {
//         return res.status(400).json({
//           message: "Apartment, unit, category, priority, and description are required"
//         });
//       }

//       // Find vendor if provided
//       let assignedToVendor = null;
//       if (vendor) {
//         const vendorDoc = await MaintenanceVendor.findOne({ name: vendor });
//         if (vendorDoc) {
//           assignedToVendor = vendorDoc._id;
//         }
//       }

//       // Create maintenance issue
//       const issue = new MaintenanceIssue({
//         apartment,
//         unit,
//         category,
//         priority,
//         description,
//         reportedBy: req.user.firstName + ' ' + req.user.lastName,
//         reportedByUser: req.user.id,
//         assignedTo: assignedTo || '',
//         assignedToVendor,
//         estimatedCost: estimatedCost || 0,
//         estimatedDuration: estimatedDuration || 0,
//         warranty: warranty || false,
//         scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
//         createdBy: req.user.id
//       });

//       await issue.save();

//       const populatedIssue = await MaintenanceIssue.findById(issue._id)
//         .populate('createdBy', 'firstName lastName')
//         .populate('assignedToVendor', 'name specialty contact email rating');

//       res.status(201).json({
//         message: "Maintenance issue created successfully",
//         issue: populatedIssue
//       });

//     } catch (error) {
//       console.error('Create maintenance issue error:', error);
      
//       if (error.name === 'ValidationError') {
//         const errors = Object.values(error.errors).map(err => err.message);
//         return res.status(400).json({
//           message: "Validation failed",
//           errors: errors
//         });
//       }

//       res.status(500).json({
//         message: "Failed to create maintenance issue",
//         error: error.message
//       });
//     }
//   },
 
  createIssue: async (req, res) => {
    try {
      const {
        apartment,
        unit,
        category,
        priority,
        description,
        assignedTo,
        estimatedCost,
        estimatedDuration,
        vendor,
        warranty,
        scheduledDate
      } = req.body;

      // Validate required fields
      if (!apartment || !unit || !category || !priority || !description) {
        return res.status(400).json({
          message: "Apartment, unit, category, priority, and description are required"
        });
      }

      // Find vendor if provided
      let assignedToVendor = null;
      if (vendor) {
        const vendorDoc = await MaintenanceVendor.findOne({ name: vendor });
        if (vendorDoc) {
          assignedToVendor = vendorDoc._id;
        }
      }

      // MANUALLY generate issue number as fallback
      const manualIssueNumber = `MT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      console.log('Manually generated issue number:', manualIssueNumber);

      // Create maintenance issue with manually generated number
      const issue = new MaintenanceIssue({
        issueNumber: manualIssueNumber, // Force set issue number
        apartment,
        unit,
        category,
        priority,
        description,
        reportedBy: req.user.firstName + ' ' + req.user.lastName,
        reportedByUser: req.user.id,
        assignedTo: assignedTo || '',
        assignedToVendor,
        estimatedCost: estimatedCost || 0,
        estimatedDuration: estimatedDuration || 0,
        warranty: warranty || false,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        createdBy: req.user.id
      });

      await issue.save();

      const populatedIssue = await MaintenanceIssue.findById(issue._id)
        .populate('createdBy', 'firstName lastName')
        .populate('assignedToVendor', 'name specialty contact email rating');

      res.status(201).json({
        message: "Maintenance issue created successfully",
        issue: populatedIssue
      });

    } catch (error) {
      console.error('Create maintenance issue error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to create maintenance issue",
        error: error.message
      });
    }
  },
 
  // Update maintenance issue
  updateIssue: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const issue = await MaintenanceIssue.findById(id);

      if (!issue) {
        return res.status(404).json({
          message: "Maintenance issue not found"
        });
      }

      // Handle vendor assignment
      if (updateData.vendor) {
        const vendorDoc = await MaintenanceVendor.findOne({ name: updateData.vendor });
        if (vendorDoc) {
          updateData.assignedToVendor = vendorDoc._id;
        }
        delete updateData.vendor;
      }

      const updatedIssue = await MaintenanceIssue.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('createdBy', 'firstName lastName')
      .populate('assignedToVendor', 'name specialty contact email rating');

      res.status(200).json({
        message: "Maintenance issue updated successfully",
        issue: updatedIssue
      });

    } catch (error) {
      console.error('Update maintenance issue error:', error);
      res.status(500).json({
        message: "Failed to update maintenance issue",
        error: error.message
      });
    }
  },

  // Update issue status
  updateIssueStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          message: "Status is required"
        });
      }

      const issue = await MaintenanceIssue.findById(id);

      if (!issue) {
        return res.status(404).json({
          message: "Maintenance issue not found"
        });
      }

      const updateData = { status };

      // Set completion/verification dates
      if (status === 'completed' && !issue.completedAt) {
        updateData.completedAt = new Date();
      } else if (status === 'verified' && !issue.verifiedAt) {
        updateData.verifiedAt = new Date();
      } else if (status === 'reopened') {
        updateData.completedAt = undefined;
        updateData.verifiedAt = undefined;
      }

      const updatedIssue = await MaintenanceIssue.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
      .populate('createdBy', 'firstName lastName')
      .populate('assignedToVendor', 'name specialty contact email rating');

      res.status(200).json({
        message: "Issue status updated successfully",
        issue: updatedIssue
      });

    } catch (error) {
      console.error('Update issue status error:', error);
      res.status(500).json({
        message: "Failed to update issue status",
        error: error.message
      });
    }
  },

  // Delete maintenance issue
  deleteIssue: async (req, res) => {
    try {
      const { id } = req.params;

      const issue = await MaintenanceIssue.findById(id);

      if (!issue) {
        return res.status(404).json({
          message: "Maintenance issue not found"
        });
      }

      await MaintenanceIssue.findByIdAndDelete(id);

      res.status(200).json({
        message: "Maintenance issue deleted successfully"
      });

    } catch (error) {
      console.error('Delete maintenance issue error:', error);
      res.status(500).json({
        message: "Failed to delete maintenance issue",
        error: error.message
      });
    }
  },

  // Get maintenance statistics
  getMaintenanceStats: async (req, res) => {
    try {
      const totalIssues = await MaintenanceIssue.countDocuments();
      const activeIssues = await MaintenanceIssue.countDocuments({
        status: { $in: ['reported', 'assigned', 'in-progress'] }
      });
      const urgentIssues = await MaintenanceIssue.countDocuments({ priority: 'urgent' });
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const completedThisMonth = await MaintenanceIssue.countDocuments({
        status: 'completed',
        completedAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });

      // Calculate costs
      const costStats = await MaintenanceIssue.aggregate([
        {
          $group: {
            _id: null,
            totalActualCost: { $sum: '$actualCost' },
            totalEstimatedCost: { $sum: '$estimatedCost' },
            pendingCost: {
              $sum: {
                $cond: [
                  { $eq: ['$actualCost', 0] },
                  '$estimatedCost',
                  0
                ]
              }
            }
          }
        }
      ]);

      const totalCost = costStats[0]?.totalActualCost || 0;
      const pendingCost = costStats[0]?.pendingCost || 0;

      // Category breakdown
      const categoryStats = await MaintenanceIssue.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCost: { $sum: '$actualCost' }
          }
        }
      ]);

      // Priority breakdown
      const priorityStats = await MaintenanceIssue.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        stats: {
          totalIssues,
          activeIssues,
          urgentIssues,
          completedThisMonth,
          totalCost,
          pendingCost,
          categoryStats,
          priorityStats
        }
      });

    } catch (error) {
      console.error('Get maintenance stats error:', error);
      res.status(500).json({
        message: "Failed to fetch maintenance statistics",
        error: error.message
      });
    }
  }
};

module.exports = maintenanceController;









