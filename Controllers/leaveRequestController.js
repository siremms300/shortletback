const LeaveRequest = require("../Models/LeaveRequestModel");
const Staff = require("../Models/StaffModel");

const leaveRequestController = {
  // Get all leave requests
  getAllLeaveRequests: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        staffId, 
        status, 
        type,
        startDate,
        endDate
      } = req.query;

      const query = {};
      
      if (staffId) query.staff = staffId;
      if (status && status !== 'all') query.status = status;
      if (type && type !== 'all') query.type = type;
      
      // Date filtering
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        query.$or = [
          { startDate: { $lte: end, $gte: start } },
          { endDate: { $lte: end, $gte: start } },
          { $and: [{ startDate: { $lte: start } }, { endDate: { $gte: end } }] }
        ];
      }

      const leaveRequests = await LeaveRequest.find(query)
        .populate('staff', 'name role department staffNumber email phone')
        .populate('createdBy', 'firstName lastName')
        .populate('reviewedBy', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await LeaveRequest.countDocuments(query);

      res.status(200).json({
        leaveRequests,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get leave requests error:', error);
      res.status(500).json({
        message: "Failed to fetch leave requests",
        error: error.message
      });
    }
  },

  // Create leave request
  createLeaveRequest: async (req, res) => {
    try {
      const {
        staffId,
        type,
        startDate,
        endDate,
        reason
      } = req.body;

      // Validate required fields
      if (!staffId || !type || !startDate || !endDate || !reason) {
        return res.status(400).json({
          message: "Staff ID, type, start date, end date, and reason are required"
        });
      }

      // Check if staff exists
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          message: "End date must be after start date"
        });
      }

      if (start < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({
          message: "Start date cannot be in the past"
        });
      }

      // Check for overlapping leave requests
      const overlappingRequest = await LeaveRequest.findOne({
        staff: staffId,
        status: 'approved',
        $or: [
          { startDate: { $lte: end, $gte: start } },
          { endDate: { $lte: end, $gte: start } },
          { $and: [{ startDate: { $lte: start } }, { endDate: { $gte: end } }] }
        ]
      });

      if (overlappingRequest) {
        return res.status(400).json({
          message: "Staff member already has approved leave during this period"
        });
      }

      // Manual number generation as fallback
      const manualRequestNumber = `LEAVE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const leaveRequest = new LeaveRequest({
        requestNumber: manualRequestNumber,
        staff: staffId,
        type,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        status: 'pending',
        submittedAt: new Date(),
        createdBy: req.user.id
      });

      await leaveRequest.save();

      const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Leave request submitted successfully",
        leaveRequest: populatedRequest
      });

    } catch (error) {
      console.error('Create leave request error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to submit leave request",
        error: error.message
      });
    }
  },

  // Update leave request status
  updateLeaveStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          message: "Valid status (approved/rejected) is required"
        });
      }

      const leaveRequest = await LeaveRequest.findById(id);

      if (!leaveRequest) {
        return res.status(404).json({
          message: "Leave request not found"
        });
      }

      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({
          message: "Leave request has already been processed"
        });
      }

      leaveRequest.status = status;
      leaveRequest.reviewedBy = req.user.id;
      leaveRequest.reviewedAt = new Date();
      
      if (reviewNotes) {
        leaveRequest.reviewNotes = reviewNotes;
      }

      await leaveRequest.save();

      // If approved, update staff status if the leave is current
      if (status === 'approved') {
        const today = new Date();
        if (leaveRequest.startDate <= today && leaveRequest.endDate >= today) {
          await Staff.findByIdAndUpdate(leaveRequest.staff, {
            status: 'on-leave'
          });
        }
      }

      const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName')
        .populate('reviewedBy', 'firstName lastName');

      res.status(200).json({
        message: `Leave request ${status} successfully`,
        leaveRequest: populatedRequest
      });

    } catch (error) {
      console.error('Update leave status error:', error);
      res.status(500).json({
        message: "Failed to update leave request status",
        error: error.message
      });
    }
  },

  // Get leave request by ID
  getLeaveRequestById: async (req, res) => {
    try {
      const { id } = req.params;

      const leaveRequest = await LeaveRequest.findById(id)
        .populate('staff', 'name role department staffNumber email phone')
        .populate('createdBy', 'firstName lastName')
        .populate('reviewedBy', 'firstName lastName');

      if (!leaveRequest) {
        return res.status(404).json({
          message: "Leave request not found"
        });
      }

      res.status(200).json({
        leaveRequest
      });

    } catch (error) {
      console.error('Get leave request error:', error);
      res.status(500).json({
        message: "Failed to fetch leave request",
        error: error.message
      });
    }
  },

  // Delete leave request
  deleteLeaveRequest: async (req, res) => {
    try {
      const { id } = req.params;

      const leaveRequest = await LeaveRequest.findById(id);

      if (!leaveRequest) {
        return res.status(404).json({
          message: "Leave request not found"
        });
      }

      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({
          message: "Only pending leave requests can be deleted"
        });
      }

      await LeaveRequest.findByIdAndDelete(id);

      res.status(200).json({
        message: "Leave request deleted successfully"
      });

    } catch (error) {
      console.error('Delete leave request error:', error);
      res.status(500).json({
        message: "Failed to delete leave request",
        error: error.message
      });
    }
  }
};

module.exports = leaveRequestController;