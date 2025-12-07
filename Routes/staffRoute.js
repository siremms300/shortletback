const express = require("express");
const router = express.Router();
const staffController = require("../Controllers/staffController");
const attendanceController = require("../Controllers/attendanceController");
const dailyReportController = require("../Controllers/dailyReportController");
const leaveRequestController = require("../Controllers/leaveRequestController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Staff routes
router.get("/staff", staffController.getAllStaff);
router.get("/staff/stats", staffController.getStaffStats);
router.get("/staff/:id", staffController.getStaffById);
router.post("/staff", staffController.createStaff);
router.put("/staff/:id", staffController.updateStaff);
router.delete("/staff/:id", staffController.deleteStaff);

// Attendance routes
router.get("/attendance", attendanceController.getAllAttendance);
router.post("/attendance/checkin", attendanceController.checkIn);
router.post("/attendance/checkout", attendanceController.checkOut);
router.put("/attendance/:id", attendanceController.updateAttendance);
router.delete("/attendance/:id", attendanceController.deleteAttendance);

// Daily report routes
router.get("/reports", dailyReportController.getAllReports);
router.get("/reports/:id", dailyReportController.getReportById);
router.post("/reports", dailyReportController.createReport);
router.put("/reports/:id", dailyReportController.updateReport);
router.delete("/reports/:id", dailyReportController.deleteReport);

// Leave request routes
router.get("/leaves", leaveRequestController.getAllLeaveRequests);
router.get("/leaves/:id", leaveRequestController.getLeaveRequestById);
router.post("/leaves", leaveRequestController.createLeaveRequest);
router.patch("/leaves/:id/status", leaveRequestController.updateLeaveStatus);
router.delete("/leaves/:id", leaveRequestController.deleteLeaveRequest);

module.exports = router;