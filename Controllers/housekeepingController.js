// Controllers/housekeepingController.js
const HousekeepingRequest = require("../Models/HousekeepingModel");
const Booking = require("../Models/BookingModel");
const Property = require("../Models/PropertyModel");
const User = require("../Models/UserModel");
const emailService = require("../Services/emailService");

const housekeepingController = {

    createRequest: async (req, res) => {
        try {
        const {
            bookingId,
            type,
            priority,
            description,
            notes,
            scheduledTime
        } = req.body;

        console.log('=== CREATE HOUSEKEEPING REQUEST ===');
        console.log('Request body:', req.body);
        console.log('User ID:', req.user.id);

        // Validate required fields
        if (!bookingId || !type || !description) {
            return res.status(400).json({
            message: "Booking ID, type, and description are required"
            });
        }

        // Verify booking exists and belongs to user
        const booking = await Booking.findOne({
            _id: bookingId,
            user: req.user.id,
            bookingStatus: 'confirmed'
        }).populate('property');

        if (!booking) {
            return res.status(404).json({
            message: "Valid booking not found or you don't have permission to access this booking"
            });
        }

        console.log('Found booking:', booking._id);

        // Check if user has active stay
        const today = new Date();
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        if (today < checkIn || today > checkOut) {
            return res.status(400).json({
            message: "You can only make requests during your active stay"
            });
        }

        // Generate request number manually to ensure it's set
        const requestCount = await HousekeepingRequest.countDocuments();
        const requestNumber = `HK-${(requestCount + 1).toString().padStart(4, '0')}`;

        console.log('Generated request number:', requestNumber);

        // Create housekeeping request with explicit requestNumber
        const request = new HousekeepingRequest({
            requestNumber, // Explicitly set the request number
            user: req.user.id,
            booking: bookingId,
            property: booking.property._id,
            type,
            priority: priority || 'medium',
            description,
            notes: notes || '',
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            estimatedDuration: getEstimatedDuration(type)
        });

        console.log('Saving request...');
        await request.save();
        console.log('Request saved successfully');

        // Populate response data
        const populatedRequest = await HousekeepingRequest.findById(request._id)
            .populate('user', 'firstName lastName email phone')
            .populate('property', 'title location')
            .populate('booking', 'checkIn checkOut');

        console.log('Populated request:', populatedRequest);

        // Send notification to admin
        await sendAdminNotification(populatedRequest);

        res.status(201).json({
            message: "Housekeeping request created successfully",
            request: populatedRequest
        });

        } catch (error) {
        console.error('Create housekeeping request error:', error);
        console.error('Error stack:', error.stack);
        
        // More specific error handling
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
            message: "Validation failed",
            errors: errors
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
            message: "Request number already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create request",
            error: error.message
        });
        }
    },
    

  // Get user's housekeeping requests
  getUserRequests: async (req, res) => {
    try {
      const requests = await HousekeepingRequest.find({ user: req.user.id })
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut')
        .sort({ createdAt: -1 });

      res.status(200).json({
        requests
      });

    } catch (error) {
      console.error('Get user requests error:', error);
      res.status(500).json({
        message: "Failed to fetch requests",
        error: error.message
      });
    }
  },

  // Get request by ID
  getRequestById: async (req, res) => {
    try {
      const { id } = req.params;

      const request = await HousekeepingRequest.findById(id)
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut');

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      // Check if user owns the request or is admin
      if (request.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          message: "Access denied"
        });
      }

      res.status(200).json({
        request
      });

    } catch (error) {
      console.error('Get request by ID error:', error);
      res.status(500).json({
        message: "Failed to fetch request",
        error: error.message
      });
    }
  },

  // Update request (user can only update certain fields)
  updateRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { description, notes } = req.body;

      const request = await HousekeepingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      // Check if user owns the request
      if (request.user.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access denied"
        });
      }

      // User can only update description and notes, and only if request is pending
      if (request.status !== 'pending') {
        return res.status(400).json({
          message: "Can only update pending requests"
        });
      }

      const updateData = {};
      if (description) updateData.description = description;
      if (notes !== undefined) updateData.notes = notes;

      const updatedRequest = await HousekeepingRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut');

      res.status(200).json({
        message: "Request updated successfully",
        request: updatedRequest
      });

    } catch (error) {
      console.error('Update request error:', error);
      res.status(500).json({
        message: "Failed to update request",
        error: error.message
      });
    }
  },

  // Cancel request
  cancelRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const request = await HousekeepingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      // Check if user owns the request
      if (request.user.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access denied"
        });
      }

      // Can only cancel pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({
          message: "Can only cancel pending requests"
        });
      }

      request.status = 'cancelled';
      request.cancellationReason = cancellationReason;
      request.cancelledAt = new Date();
      await request.save();

      const populatedRequest = await HousekeepingRequest.findById(request._id)
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut');

      res.status(200).json({
        message: "Request cancelled successfully",
        request: populatedRequest
      });

    } catch (error) {
      console.error('Cancel request error:', error);
      res.status(500).json({
        message: "Failed to cancel request",
        error: error.message
      });
    }
  },

  // ADMIN FUNCTIONS

  // Get all requests (admin only)
  getAllRequests: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        type,
        dateFrom,
        dateTo
      } = req.query;

      const query = {};

      // Build filter query
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (type) query.type = type;
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const requests = await HousekeepingRequest.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await HousekeepingRequest.countDocuments(query);

      res.status(200).json({
        requests,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get all requests error:', error);
      res.status(500).json({
        message: "Failed to fetch requests",
        error: error.message
      });
    }
  },

  // Update request status (admin only)
  updateRequestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assignedTo, adminNotes, actualDuration } = req.body;

      const request = await HousekeepingRequest.findById(id)
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location');

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      const updateData = {};

      if (status) {
        updateData.status = status;
        
        // Set timestamps based on status
        if (status === 'completed' && request.status !== 'completed') {
          updateData.completedAt = new Date();
        } else if (status === 'verified' && request.status !== 'verified') {
          updateData.verifiedAt = new Date();
        }
      }

      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (actualDuration !== undefined) updateData.actualDuration = actualDuration;

      const updatedRequest = await HousekeepingRequest.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user', 'firstName lastName email phone')
        .populate('property', 'title location')
        .populate('booking', 'checkIn checkOut');

      // Send status update notification to user
      if (status && status !== request.status) {
        await sendStatusUpdateNotification(updatedRequest);
      }

      res.status(200).json({
        message: "Request updated successfully",
        request: updatedRequest
      });

    } catch (error) {
      console.error('Update request status error:', error);
      res.status(500).json({
        message: "Failed to update request",
        error: error.message
      });
    }
  },

  // Get housekeeping stats (admin only)
  getHousekeepingStats: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const totalRequests = await HousekeepingRequest.countDocuments();
      const pendingRequests = await HousekeepingRequest.countDocuments({ status: 'pending' });
      const inProgressRequests = await HousekeepingRequest.countDocuments({ status: 'in-progress' });
      const completedToday = await HousekeepingRequest.countDocuments({
        status: 'completed',
        completedAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      // Priority breakdown
      const priorityStats = await HousekeepingRequest.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      // Type breakdown
      const typeStats = await HousekeepingRequest.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        stats: {
          totalRequests,
          pendingRequests,
          inProgressRequests,
          completedToday,
          priorityBreakdown: priorityStats,
          typeBreakdown: typeStats
        }
      });

    } catch (error) {
      console.error('Get housekeeping stats error:', error);
      res.status(500).json({
        message: "Failed to fetch stats",
        error: error.message
      });
    }
  }
};

// Helper functions
function getEstimatedDuration(type) {
  switch (type) {
    case 'cleaning': return 120;
    case 'linen': return 30;
    case 'amenities': return 15;
    case 'maintenance': return 60;
    default: return 30;
  }
}

async function sendAdminNotification(request) {
  try {
    const adminEmail = 'techidoga@gmail.com'; // Should be from config
    const subject = `New Housekeeping Request - ${request.requestNumber}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f06123;">New Housekeeping Request</h2>
        <p><strong>Request Number:</strong> ${request.requestNumber}</p>
        <p><strong>Guest:</strong> ${request.user.firstName} ${request.user.lastName}</p>
        <p><strong>Property:</strong> ${request.property.title}</p>
        <p><strong>Type:</strong> ${request.type}</p>
        <p><strong>Priority:</strong> ${request.priority}</p>
        <p><strong>Description:</strong> ${request.description}</p>
        <p><strong>Requested At:</strong> ${request.createdAt.toLocaleString()}</p>
        <br>
        <p>Please log in to the admin panel to assign and manage this request.</p>
      </div>
    `;

    await emailService.transporter.sendMail({
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html: htmlContent
    });

    console.log(`Admin notification sent for request ${request.requestNumber}`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

async function sendStatusUpdateNotification(request) {
  try {
    const subject = `Housekeeping Request Update - ${request.requestNumber}`;
    
    const statusMessages = {
      'in-progress': 'has been assigned and is in progress',
      'completed': 'has been completed',
      'verified': 'has been verified and closed'
    };

    const message = statusMessages[request.status] || 'status has been updated';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f06123;">Housekeeping Request Update</h2>
        <p>Hello ${request.user.firstName},</p>
        <p>Your housekeeping request <strong>${request.requestNumber}</strong> ${message}.</p>
        <p><strong>Current Status:</strong> ${request.status}</p>
        ${request.assignedTo ? `<p><strong>Assigned To:</strong> ${request.assignedTo}</p>` : ''}
        ${request.adminNotes ? `<p><strong>Admin Notes:</strong> ${request.adminNotes}</p>` : ''}
        <br>
        <p>Thank you for choosing Hols Apartments!</p>
      </div>
    `;

    await emailService.transporter.sendMail({
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: request.user.email,
      subject,
      html: htmlContent
    });

    console.log(`Status update notification sent to ${request.user.email}`);
  } catch (error) {
    console.error('Failed to send status update notification:', error);
  }
}

module.exports = housekeepingController;




 
  