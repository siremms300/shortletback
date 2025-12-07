// controllers/adminAccessPassController.js
const Booking = require("../Models/BookingModel");
const accessPassService = require("../Services/accessPassService");

const adminAccessPassController = {
  // Send access pass to user
  sendAccessPass: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { accessCode, provider, instructions } = req.body;
 
      if (!accessCode || accessCode.trim() === '') {
        return res.status(400).json({ message: "Access code is required" });
      }
 
      // Find booking
      const booking = await Booking.findById(bookingId)
        .populate('property')
        .populate('user');

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking is confirmed
      if (booking.bookingStatus !== 'confirmed') {
        return res.status(400).json({ message: "Cannot send access pass for unconfirmed booking" });
      }

      // Check if access pass was already sent
      if (booking.accessPass?.status === 'sent') {
        return res.status(400).json({ message: "Access pass has already been sent for this booking" });
      }

      // Send access pass
      await accessPassService.sendAccessPass(
        booking, 
        accessCode, 
        req.user, // admin user
        provider, 
        instructions
      );

      const updatedBooking = await Booking.findById(bookingId)
        .populate('property')
        .populate('user')
        .populate('accessPass.sentBy', 'firstName lastName');

      res.status(200).json({
        message: "Access pass sent successfully",
        booking: updatedBooking
      });

    } catch (err) {
      console.error('Send access pass error:', err);
      res.status(500).json({ 
        message: "Failed to send access pass", 
        error: err.message 
      });
    }
  },

  // Update access pass (if needed)
  updateAccessPass: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { accessCode, provider, instructions } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update access pass
      if (accessCode) booking.accessPass.code = accessCode.trim();
      if (provider) booking.accessPass.providedBy = provider.trim();
      if (instructions) booking.accessPass.instructions = instructions.trim();
      
      booking.accessPass.sentAt = new Date();
      booking.accessPass.sentBy = req.user._id;
      booking.accessPass.status = 'sent';

      await booking.save();

      const updatedBooking = await Booking.findById(bookingId)
        .populate('property')
        .populate('user')
        .populate('accessPass.sentBy', 'firstName lastName');

      res.status(200).json({
        message: "Access pass updated successfully",
        booking: updatedBooking
      });

    } catch (err) {
      console.error('Update access pass error:', err);
      res.status(500).json({ 
        message: "Failed to update access pass", 
        error: err.message 
      });
    }
  },

  // Get booking access pass info
  getAccessPassInfo: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId)
        .populate('property', 'title location')
        .populate('user', 'firstName lastName email')
        .populate('accessPass.sentBy', 'firstName lastName');

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.status(200).json({
        accessPass: booking.accessPass,
        booking: {
          _id: booking._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          property: booking.property,
          user: booking.user
        }
      });

    } catch (err) {
      console.error('Get access pass info error:', err);
      res.status(500).json({ 
        message: "Failed to fetch access pass information", 
        error: err.message 
      });
    }
  }
};

module.exports = adminAccessPassController;