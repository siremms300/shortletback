const DailyReport = require("../Models/DailyReportModel");
const Staff = require("../Models/StaffModel");

const dailyReportController = {
  // Get all daily reports
  getAllReports: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        staffId, 
        startDate, 
        endDate,
        search 
      } = req.query;

      const query = {};
      
      if (staffId) query.staff = staffId;
      
      // Date filtering
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        query.date = { $gte: start, $lte: end };
      }

      // Search in tasks, issues, or supplies
      if (search) {
        query.$or = [
          { tasksCompleted: { $in: [new RegExp(search, 'i')] } },
          { issuesReported: { $in: [new RegExp(search, 'i')] } },
          { suppliesUsed: { $in: [new RegExp(search, 'i')] } },
          { guestFeedback: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      const reports = await DailyReport.find(query)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1, submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await DailyReport.countDocuments(query);

      res.status(200).json({
        reports,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get daily reports error:', error);
      res.status(500).json({
        message: "Failed to fetch daily reports",
        error: error.message
      });
    }
  },

  // Create daily report
  createReport: async (req, res) => {
    try {
      const {
        staffId,
        date,
        tasksCompleted,
        issuesReported,
        suppliesUsed,
        guestFeedback,
        notes
      } = req.body;

      // Validate required fields
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

      // Filter out empty strings from arrays
      const filteredTasks = Array.isArray(tasksCompleted) ? tasksCompleted.filter(task => task.trim() !== '') : [];
      const filteredIssues = Array.isArray(issuesReported) ? issuesReported.filter(issue => issue.trim() !== '') : [];
      const filteredSupplies = Array.isArray(suppliesUsed) ? suppliesUsed.filter(supply => supply.trim() !== '') : [];

      // Manual number generation as fallback
      const manualReportNumber = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const report = new DailyReport({
        reportNumber: manualReportNumber,
        staff: staffId,
        date: date ? new Date(date) : new Date(),
        tasksCompleted: filteredTasks,
        issuesReported: filteredIssues,
        suppliesUsed: filteredSupplies,
        guestFeedback: guestFeedback || '',
        notes: notes || '',
        submittedAt: new Date(),
        createdBy: req.user.id
      });

      await report.save();

      const populatedReport = await DailyReport.findById(report._id)
        .populate('staff', 'name role department staffNumber')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Daily report submitted successfully",
        report: populatedReport
      });

    } catch (error) {
      console.error('Create daily report error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to submit daily report",
        error: error.message
      });
    }
  },

  // Get report by ID
  getReportById: async (req, res) => {
    try {
      const { id } = req.params;

      const report = await DailyReport.findById(id)
        .populate('staff', 'name role department staffNumber email phone')
        .populate('createdBy', 'firstName lastName');

      if (!report) {
        return res.status(404).json({
          message: "Daily report not found"
        });
      }

      res.status(200).json({
        report
      });

    } catch (error) {
      console.error('Get daily report error:', error);
      res.status(500).json({
        message: "Failed to fetch daily report",
        error: error.message
      });
    }
  },

  // Update daily report
  updateReport: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const report = await DailyReport.findById(id);

      if (!report) {
        return res.status(404).json({
          message: "Daily report not found"
        });
      }

      // Filter out empty strings from arrays if provided
      if (updateData.tasksCompleted) {
        updateData.tasksCompleted = updateData.tasksCompleted.filter(task => task.trim() !== '');
      }
      if (updateData.issuesReported) {
        updateData.issuesReported = updateData.issuesReported.filter(issue => issue.trim() !== '');
      }
      if (updateData.suppliesUsed) {
        updateData.suppliesUsed = updateData.suppliesUsed.filter(supply => supply.trim() !== '');
      }

      const updatedReport = await DailyReport.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('staff', 'name role department staffNumber')
      .populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Daily report updated successfully",
        report: updatedReport
      });

    } catch (error) {
      console.error('Update daily report error:', error);
      res.status(500).json({
        message: "Failed to update daily report",
        error: error.message
      });
    }
  },

  // Delete daily report
  deleteReport: async (req, res) => {
    try {
      const { id } = req.params;

      const report = await DailyReport.findById(id);

      if (!report) {
        return res.status(404).json({
          message: "Daily report not found"
        });
      }

      await DailyReport.findByIdAndDelete(id);

      res.status(200).json({
        message: "Daily report deleted successfully"
      });

    } catch (error) {
      console.error('Delete daily report error:', error);
      res.status(500).json({
        message: "Failed to delete daily report",
        error: error.message
      });
    }
  }
};

module.exports = dailyReportController;