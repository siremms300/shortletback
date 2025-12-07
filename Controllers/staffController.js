const Staff = require("../Models/StaffModel");
const Attendance = require("../Models/AttendanceModel");
const DailyReport = require("../Models/DailyReportModel");
const LeaveRequest = require("../Models/LeaveRequestModel");

const staffController = {
  // Get all staff members
  getAllStaff: async (req, res) => {
    try {
      const { page = 1, limit = 50, status, role, department, search } = req.query;

      const query = {};
      if (status && status !== 'all') query.status = status;
      if (role && role !== 'all') query.role = role;
      if (department && department !== 'all') query.department = department;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { staffNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const staff = await Staff.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Staff.countDocuments(query);

      res.status(200).json({
        staff,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get staff error:', error);
      res.status(500).json({
        message: "Failed to fetch staff",
        error: error.message
      });
    }
  },

  // Get staff by ID
  getStaffById: async (req, res) => {
    try {
      const { id } = req.params;

      const staff = await Staff.findById(id)
        .populate('createdBy', 'firstName lastName');

      if (!staff) {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      res.status(200).json({
        staff
      });

    } catch (error) {
      console.error('Get staff error:', error);
      res.status(500).json({
        message: "Failed to fetch staff member",
        error: error.message
      });
    }
  },

  // Create new staff member
  createStaff: async (req, res) => {
    try {
      const {
        name,
        role,
        email,
        phone,
        department,
        salary,
        status,
        schedule
      } = req.body;

      // Validate required fields
      if (!name || !role || !email || !phone || !department) {
        return res.status(400).json({
          message: "Name, role, email, phone, and department are required"
        });
      }

      // Check if staff already exists
      const existingStaff = await Staff.findOne({
        $or: [
          { email: email.toLowerCase() },
          { phone: phone }
        ]
      });

      if (existingStaff) {
        return res.status(400).json({
          message: "Staff member with this email or phone already exists"
        });
      }

      // Create staff with manual number generation as fallback
      const manualStaffNumber = `STF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const staff = new Staff({
        staffNumber: manualStaffNumber,
        name,
        role,
        email: email.toLowerCase(),
        phone,
        department,
        salary: salary || 0,
        status: status || 'active',
        schedule: schedule || {
          monday: { start: '09:00', end: '17:00', working: true },
          tuesday: { start: '09:00', end: '17:00', working: true },
          wednesday: { start: '09:00', end: '17:00', working: true },
          thursday: { start: '09:00', end: '17:00', working: true },
          friday: { start: '09:00', end: '17:00', working: true },
          saturday: { start: '10:00', end: '14:00', working: false },
          sunday: { start: '10:00', end: '14:00', working: false }
        },
        createdBy: req.user.id
      });

      await staff.save();

      const populatedStaff = await Staff.findById(staff._id)
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Staff member created successfully",
        staff: populatedStaff
      });

    } catch (error) {
      console.error('Create staff error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to create staff member",
        error: error.message
      });
    }
  },

  // Update staff member
  updateStaff: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const staff = await Staff.findById(id);

      if (!staff) {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      const updatedStaff = await Staff.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Staff member updated successfully",
        staff: updatedStaff
      });

    } catch (error) {
      console.error('Update staff error:', error);
      res.status(500).json({
        message: "Failed to update staff member",
        error: error.message
      });
    }
  },

  // Delete staff member
  deleteStaff: async (req, res) => {
    try {
      const { id } = req.params;

      const staff = await Staff.findById(id);

      if (!staff) {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      // Check if staff has associated records
      const hasAttendance = await Attendance.exists({ staff: id });
      const hasReports = await DailyReport.exists({ staff: id });
      const hasLeaveRequests = await LeaveRequest.exists({ staff: id });

      if (hasAttendance || hasReports || hasLeaveRequests) {
        return res.status(400).json({
          message: "Cannot delete staff member with associated records"
        });
      }

      await Staff.findByIdAndDelete(id);

      res.status(200).json({
        message: "Staff member deleted successfully"
      });

    } catch (error) {
      console.error('Delete staff error:', error);
      res.status(500).json({
        message: "Failed to delete staff member",
        error: error.message
      });
    }
  },

  // Get staff statistics
  getStaffStats: async (req, res) => {
    try {
      const totalStaff = await Staff.countDocuments();
      const activeStaff = await Staff.countDocuments({ status: 'active' });
      const onLeaveStaff = await Staff.countDocuments({ status: 'on-leave' });

      // Role distribution
      const roleStats = await Staff.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      // Department distribution
      const departmentStats = await Staff.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]);

      // Today's attendance stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const presentToday = await Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: 'present'
      });

      const lateToday = await Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        lateMinutes: { $gt: 0 }
      });

      // Current month overtime
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      const overtimeResult = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: currentMonthStart, $lt: nextMonthStart },
            overtimeMinutes: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalOvertime: { $sum: '$overtimeMinutes' }
          }
        }
      ]);

      const totalOvertimeThisMonth = overtimeResult[0]?.totalOvertime || 0;

      res.status(200).json({
        stats: {
          totalStaff,
          activeStaff,
          onLeaveStaff,
          presentToday,
          lateToday,
          totalOvertimeThisMonth: totalOvertimeThisMonth / 60, // Convert to hours
          roleStats,
          departmentStats
        }
      });

    } catch (error) {
      console.error('Get staff stats error:', error);
      res.status(500).json({
        message: "Failed to fetch staff statistics",
        error: error.message
      });
    }
  }
};

module.exports = staffController;