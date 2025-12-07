const Attendance = require("../Models/AttendanceModel");
const Staff = require("../Models/StaffModel");

const attendanceController = {
  // Get all attendance records
  getAllAttendance: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        staffId, 
        date, 
        status,
        startDate,
        endDate
      } = req.query;

      const query = {};
      
      if (staffId) query.staff = staffId;
      if (status && status !== 'all') query.status = status;
      
      // Date filtering
      if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        query.date = { $gte: targetDate, $lt: nextDate };
      } else if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        query.date = { $gte: start, $lte: end };
      }

      const attendance = await Attendance.find(query)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Attendance.countDocuments(query);

      res.status(200).json({
        attendance,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({
        message: "Failed to fetch attendance records",
        error: error.message
      });
    }
  },

  // Check in staff member
  checkIn: async (req, res) => {
    try {
      const { staffId, location, notes } = req.body;

      if (!staffId) {
        return res.status(400).json({
          message: "Staff ID is required"
        });
      }

      // Check if staff exists
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingRecord = await Attendance.findOne({
        staff: staffId,
        date: { $gte: today, $lt: tomorrow }
      });

      if (existingRecord) {
        return res.status(400).json({
          message: "Staff member already checked in today"
        });
      }

      // Calculate late minutes
      const checkInTime = new Date();
      let lateMinutes = 0;

      // Check if staff is scheduled today and calculate lateness
      const todayDay = today.getDay();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todaySchedule = staff.schedule[days[todayDay]];

      if (todaySchedule.working) {
        const [scheduledHour, scheduledMinute] = todaySchedule.start.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);

        if (checkInTime > scheduledTime) {
          lateMinutes = Math.max(0, (checkInTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
        }
      }

      // Manual number generation as fallback
      const manualAttendanceNumber = `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const attendance = new Attendance({
        attendanceNumber: manualAttendanceNumber,
        staff: staffId,
        date: today,
        checkIn: checkInTime,
        status: lateMinutes > 0 ? 'late' : 'present',
        lateMinutes: Math.round(lateMinutes),
        location: location || 'Manual entry',
        notes: notes || '',
        createdBy: req.user.id
      });

      await attendance.save();

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Check-in recorded successfully",
        attendance: populatedAttendance
      });

    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        message: "Failed to record check-in",
        error: error.message
      });
    }
  },

  // Check out staff member
  checkOut: async (req, res) => {
    try {
      const { staffId, notes } = req.body;

      if (!staffId) {
        return res.status(400).json({
          message: "Staff ID is required"
        });
      }

      // Find today's attendance record
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendanceRecord = await Attendance.findOne({
        staff: staffId,
        date: { $gte: today, $lt: tomorrow },
        checkOut: { $exists: false }
      });

      if (!attendanceRecord) {
        return res.status(404).json({
          message: "No active check-in found for today"
        });
      }

      // Calculate hours worked and overtime
      const checkOutTime = new Date();
      const checkInTime = attendanceRecord.checkIn;
      const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      let overtimeMinutes = 0;
      const staff = await Staff.findById(staffId);
      
      if (staff) {
        const todayDay = today.getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todaySchedule = staff.schedule[days[todayDay]];

        if (todaySchedule.working) {
          const [startHour, startMinute] = todaySchedule.start.split(':').map(Number);
          const [endHour, endMinute] = todaySchedule.end.split(':').map(Number);

          const scheduledHours = (endHour + endMinute/60) - (startHour + startMinute/60);
          const overtime = hoursWorked - scheduledHours;
          overtimeMinutes = Math.max(0, overtime * 60);
        }
      }

      attendanceRecord.checkOut = checkOutTime;
      attendanceRecord.hoursWorked = parseFloat(hoursWorked.toFixed(2));
      attendanceRecord.overtimeMinutes = Math.round(overtimeMinutes);
      attendanceRecord.notes = notes || attendanceRecord.notes;

      await attendanceRecord.save();

      const populatedAttendance = await Attendance.findById(attendanceRecord._id)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Check-out recorded successfully",
        attendance: populatedAttendance
      });

    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({
        message: "Failed to record check-out",
        error: error.message
      });
    }
  },

  // Update attendance record
  updateAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const attendance = await Attendance.findById(id);

      if (!attendance) {
        return res.status(404).json({
          message: "Attendance record not found"
        });
      }

      const updatedAttendance = await Attendance.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('staff', 'name role department staffNumber')
      .populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Attendance record updated successfully",
        attendance: updatedAttendance
      });

    } catch (error) {
      console.error('Update attendance error:', error);
      res.status(500).json({
        message: "Failed to update attendance record",
        error: error.message
      });
    }
  },

  // Delete attendance record
  deleteAttendance: async (req, res) => {
    try {
      const { id } = req.params;

      const attendance = await Attendance.findById(id);

      if (!attendance) {
        return res.status(404).json({
          message: "Attendance record not found"
        });
      }

      await Attendance.findByIdAndDelete(id);

      res.status(200).json({
        message: "Attendance record deleted successfully"
      });

    } catch (error) {
      console.error('Delete attendance error:', error);
      res.status(500).json({
        message: "Failed to delete attendance record",
        error: error.message
      });
    }
  }
};

module.exports = attendanceController; 