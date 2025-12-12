const Booking = require("../Models/BookingModel");
const Property = require("../Models/PropertyModel");
const User = require("../Models/UserModel");
const paystack = require("../Services/paystackService");
const emailService = require("../Services/emailService");
const mongoose = require("mongoose");

const bookingController = {
  // Check property availability
  checkAvailability: async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { checkIn, checkOut } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({ 
          message: "Check-in and check-out dates are required" 
        });
      }

      const isAvailable = await Booking.checkAvailability(
        propertyId, 
        checkIn, 
        checkOut
      ); 

      res.status(200).json({ available: isAvailable });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ 
        message: "Failed to check availability", 
        error: error.message 
      });
    }
  },

  // Create booking @@@@@@@@@@@@@@@@@ THE ONE BELOW IS WORKING @@@@@@@@@@@@@@@@@@@@@@@@@@@
  // createBooking: async (req, res) => {
  //   try {
  //     const {
  //       propertyId,
  //       checkIn,
  //       checkOut,
  //       guests,
  //       specialRequests
  //     } = req.body;

  //     // Validate required fields
  //     if (!propertyId || !checkIn || !checkOut || !guests) {
  //       return res.status(400).json({ 
  //         message: "Property ID, check-in, check-out, and guests are required" 
  //       });
  //     }

  //     // Check if property exists and is active
  //     const property = await Property.findById(propertyId);
  //     if (!property || property.status !== 'active') {
  //       return res.status(404).json({ message: "Property not available" });
  //     }

  //     // Check availability - only consider confirmed bookings
  //     const isAvailable = await Booking.checkAvailability(propertyId, checkIn, checkOut);
  //     if (!isAvailable) {
  //       return res.status(400).json({ message: "Property not available for selected dates" });
  //     }

  //     // Validate guests count
  //     if (guests > property.specifications.maxGuests) {
  //       return res.status(400).json({ 
  //         message: `Maximum ${property.specifications.maxGuests} guests allowed` 
  //       });
  //     }

  //     // Calculate total amount
  //     const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  //     const baseAmount = property.price * nights;
  //     const serviceFee = baseAmount * 0.1; // 10% service fee
  //     const totalAmount = baseAmount + serviceFee;

  //     // Create booking with pending status
  //     const booking = new Booking({
  //       property: propertyId,
  //       user: req.user.id,
  //       checkIn: new Date(checkIn),
  //       checkOut: new Date(checkOut),
  //       guests,
  //       totalAmount,
  //       serviceFee,
  //       specialRequests,
  //       paymentStatus: 'pending',
  //       bookingStatus: 'pending',
  //       paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  //     });

  //     await booking.save();

  //     // Populate booking data for response
  //     await booking.populate('property', 'title location images price specifications');
  //     await booking.populate('user', 'firstName lastName email');

  //     res.status(201).json({
  //       message: "Booking created successfully. Please complete payment to confirm your booking.",
  //       booking
  //     });

  //   } catch (error) {
  //     console.error('Create booking error:', error);
  //     res.status(500).json({ 
  //       message: "Failed to create booking", 
  //       error: error.message 
  //     });
  //   }
  // },

  // Create booking
  createBooking: async (req, res) => {
    try {
      const {
        propertyId,
        checkIn,
        checkOut,
        guests,
        specialRequests,
        paymentMethod = 'paystack' // Add payment method
      } = req.body;

      // Validate required fields
      if (!propertyId || !checkIn || !checkOut || !guests) {
        return res.status(400).json({ 
          success: false,
          message: "Property ID, check-in, check-out, and guests are required" 
        });
      }

      // Check if property exists and is active
      const property = await Property.findById(propertyId);
      if (!property || property.status !== 'active') {
        return res.status(404).json({ 
          success: false,
          message: "Property not available" 
        });
      }

      // Check availability - only consider confirmed bookings
      const isAvailable = await Booking.checkAvailability(propertyId, checkIn, checkOut);
      if (!isAvailable) {
        return res.status(400).json({ 
          success: false,
          message: "Property not available for selected dates" 
        });
      }

      // Validate guests count
      if (guests > property.specifications.maxGuests) {
        return res.status(400).json({ 
          message: `Maximum ${property.specifications.maxGuests} guests allowed` 
        });
      }

      // Calculate total amount
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      const baseAmount = property.price * nights;
      const serviceFee = baseAmount * 0.1; // 10% service fee
      const totalAmount = baseAmount + serviceFee;

      // Create booking with payment method
      const booking = new Booking({
        property: propertyId,
        user: req.user.id,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        totalAmount,
        serviceFee,
        specialRequests: specialRequests || '',
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        paymentMethod, // Add payment method
        paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // For bank transfer, initialize bank transfer details
      if (paymentMethod === 'bank_transfer') {
        booking.bankTransferDetails = {
          accountName: 'Hols Apartments Ltd',
          accountNumber: '0900408855',
          bankName: 'GT Bank',
          transferReference: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending'
        };
        // For bank transfer, booking status should remain pending until payment is verified
        booking.bookingStatus = 'pending';
      }

      // For onsite payment, initialize onsite details
      if (paymentMethod === 'onsite') {
        booking.onsitePaymentDetails = {
          expectedAmount: totalAmount,
          status: 'pending'
        };
        // For onsite payment, booking status should remain pending until payment is collected
        booking.bookingStatus = 'pending';
      }

      await booking.save();

      // Populate booking data for response
      await booking.populate('property', 'title location images price specifications');
      await booking.populate('user', 'firstName lastName email');

      // Send email notification to admin about new booking
      try {
        await emailService.sendNewBookingNotification(booking);
      } catch (emailError) {
        console.error('Failed to send booking notification:', emailError);
      }

      // Send different messages based on payment method
      let successMessage = "Booking created successfully. Please complete payment to confirm your booking.";
      
      if (paymentMethod === 'bank_transfer') {
        successMessage = "Booking created successfully. Please make a bank transfer to the provided account and upload proof of payment.";
      } else if (paymentMethod === 'onsite') {
        successMessage = "Booking created successfully. Please proceed to the property for check-in and payment.";
      }

      res.status(201).json({
        success: true,
        message: successMessage,
        booking,
        paymentMethod,
        // Include bank details if payment method is bank transfer
        ...(paymentMethod === 'bank_transfer' && {
          bankDetails: booking.bankTransferDetails
        })
      });

    } catch (error) {
      console.error('Create booking error:', error);
      
      // Handle specific errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false,
          message: "Validation error",
          error: error.message 
        });
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: "Invalid property ID format" 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to create booking", 
        error: error.message 
      });
    }
  },

  // Initialize payment - FIXED VERSION @@@@@@@@@2 THE ONE BELOW IS WORKING @@@@@@@@@@@@@@@@@@@
  // initializePayment: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { email } = req.body;

  //     console.log('🎯 [Backend] Initialize payment called for booking:', id);

  //     // Validate booking ID
  //     if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Invalid booking ID" 
  //       });
  //     }

  //     const booking = await Booking.findById(id)
  //       .populate('property', 'title')
  //       .populate('user', 'firstName lastName email');

  //     if (!booking) {
  //       console.log('❌ [Backend] Booking not found:', id);
  //       return res.status(404).json({ 
  //         success: false,
  //         message: "Booking not found" 
  //       });
  //     }

  //     // Check if booking belongs to user
  //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
  //       console.log('❌ [Backend] Access denied for user:', req.user.id);
  //       return res.status(403).json({ 
  //         success: false,
  //         message: "Access denied" 
  //       });
  //     }

  //     // Check if booking is already paid
  //     if (booking.paymentStatus === 'paid') {
  //       console.log('ℹ️ [Backend] Booking already paid:', id);
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Booking already paid" 
  //       });
  //     }

  //     // Generate new payment reference if payment was previously initialized but failed
  //     if (booking.paystackReference && booking.paymentStatus === 'pending') {
  //       booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  //       booking.paystackReference = undefined;
  //       await booking.save();
  //       console.log('🔄 [Backend] Generated new payment reference:', booking.paymentReference);
  //     }

  //     const totalAmountInKobo = Math.round(booking.totalAmount * 100); // Convert to kobo

  //     console.log('🎯 [Backend] Calling Paystack with:', {
  //       email: email || booking.user.email,
  //       amount: totalAmountInKobo,
  //       reference: booking.paymentReference,
  //       totalAmount: booking.totalAmount,
  //       totalAmountInKobo: totalAmountInKobo
  //     });

  //     // Initialize Paystack payment
  //     const paymentData = await paystack.initializeTransaction({
  //       email: email || booking.user.email,
  //       amount: totalAmountInKobo,
  //       reference: booking.paymentReference,
  //       metadata: {
  //         bookingId: booking._id.toString(),
  //         propertyTitle: booking.property.title,
  //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
  //       },
  //       callback_url: `${process.env.CLIENT_URL}/booking/success`
  //     });

  //     console.log('✅ [Backend] Paystack returned:', {
  //       hasAuthorizationUrl: !!paymentData.authorization_url,
  //       hasReference: !!paymentData.reference,
  //       data: paymentData
  //     });

  //     // Check if Paystack returned valid data
  //     if (!paymentData || !paymentData.authorization_url) {
  //       console.error('❌ [Backend] Paystack returned invalid data:', paymentData);
  //       return res.status(500).json({ 
  //         success: false,
  //         message: "Payment gateway returned invalid response",
  //         details: "No payment URL received from Paystack"
  //       });
  //     }

  //     // Update booking with Paystack reference
  //     booking.paystackReference = paymentData.reference;
  //     await booking.save();

  //     console.log('✅ [Backend] Payment initialized successfully for booking:', id);

  //     // ✅ FIX: Return the paymentData directly with proper structure
  //     res.status(200).json({
  //       success: true,
  //       message: "Payment initialized successfully",
  //       authorization_url: paymentData.authorization_url,
  //       reference: paymentData.reference,
  //       access_code: paymentData.access_code
  //     });

  //   } catch (error) {
  //     console.error('💥 [Backend] Initialize payment error:', {
  //       name: error.name,
  //       message: error.message,
  //       stack: error.stack
  //     });
      
  //     // Handle specific errors
  //     if (error.name === 'CastError') {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Invalid booking ID format" 
  //       });
  //     }
      
  //     // Check if it's a Paystack error
  //     if (error.message.includes('Paystack Error')) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: error.message 
  //       });
  //     }
      
  //     res.status(500).json({ 
  //       success: false,
  //       message: "Failed to initialize payment", 
  //       error: error.message 
  //     });
  //   }
  // },

  // Initialize payment - Updated for multiple payment methods
  initializePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      console.log('🎯 [Backend] Initialize payment called for booking:', id);

      // Validate booking ID
      if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid booking ID" 
        });
      }

      const booking = await Booking.findById(id)
        .populate('property', 'title')
        .populate('user', 'firstName lastName email');

      if (!booking) {
        console.log('❌ [Backend] Booking not found:', id);
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      // Check if booking belongs to user
      if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        console.log('❌ [Backend] Access denied for user:', req.user.id);
        return res.status(403).json({ 
          success: false,
          message: "Access denied" 
        });
      }

      // Check if booking is already paid
      if (booking.paymentStatus === 'paid') {
        console.log('ℹ️ [Backend] Booking already paid:', id);
        return res.status(400).json({ 
          success: false,
          message: "Booking already paid" 
        });
      }

      // Check payment method - only Paystack payments should use this endpoint
      if (booking.paymentMethod !== 'paystack') {
        console.log('ℹ️ [Backend] Wrong payment method:', booking.paymentMethod);
        return res.status(400).json({ 
          success: false,
          message: `This booking uses ${booking.paymentMethod === 'bank_transfer' ? 'bank transfer' : 'onsite payment'}. Please use the appropriate payment process.` 
        });
      }

      // Generate new payment reference if payment was previously initialized but failed
      if (booking.paystackReference && booking.paymentStatus === 'pending') {
        booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        booking.paystackReference = undefined;
        await booking.save();
        console.log('🔄 [Backend] Generated new payment reference:', booking.paymentReference);
      }

      const totalAmountInKobo = Math.round(booking.totalAmount * 100); // Convert to kobo

      console.log('🎯 [Backend] Calling Paystack with:', {
        email: email || booking.user.email,
        amount: totalAmountInKobo,
        reference: booking.paymentReference,
        totalAmount: booking.totalAmount,
        totalAmountInKobo: totalAmountInKobo
      });

      // Initialize Paystack payment
      const paymentData = await paystack.initializeTransaction({
        email: email || booking.user.email,
        amount: totalAmountInKobo,
        reference: booking.paymentReference,
        metadata: {
          bookingId: booking._id.toString(),
          propertyTitle: booking.property.title,
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          paymentMethod: 'paystack'
        },
        callback_url: `${process.env.CLIENT_URL}/booking/success`
      });

      console.log('✅ [Backend] Paystack returned:', {
        hasAuthorizationUrl: !!paymentData.authorization_url,
        hasReference: !!paymentData.reference,
        data: paymentData
      });

      // Check if Paystack returned valid data
      if (!paymentData || !paymentData.authorization_url) {
        console.error('❌ [Backend] Paystack returned invalid data:', paymentData);
        return res.status(500).json({ 
          success: false,
          message: "Payment gateway returned invalid response",
          details: "No payment URL received from Paystack"
        });
      }

      // Update booking with Paystack reference
      booking.paystackReference = paymentData.reference;
      await booking.save();

      console.log('✅ [Backend] Payment initialized successfully for booking:', id);

      // Return the paymentData
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        authorization_url: paymentData.authorization_url,
        reference: paymentData.reference,
        access_code: paymentData.access_code,
        paymentMethod: 'paystack'
      });

    } catch (error) {
      console.error('💥 [Backend] Initialize payment error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific errors
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: "Invalid booking ID format" 
        });
      }
      
      // Check if it's a Paystack error
      if (error.message.includes('Paystack Error')) {
        return res.status(400).json({ 
          success: false,
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to initialize payment", 
        error: error.message 
      });
    }
  },

  // Verify payment @@@@@@@@ THE ONE BELOW IS WORKING @@@@@@@@@@@@@@@@@@@@@@@@@
  // verifyPayment: async (req, res) => {
  //   try {
  //     const { reference } = req.body;

  //     if (!reference) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Payment reference is required" 
  //       });
  //     }

  //     // Verify payment with Paystack
  //     const verification = await paystack.verifyTransaction(reference);

  //     if (verification.status === 'success') {
  //       // Find booking by reference
  //       const booking = await Booking.findOne({ paystackReference: reference })
  //         .populate('property')
  //         .populate('user');

  //       if (!booking) {
  //         return res.status(404).json({ 
  //           success: false,
  //           message: "Booking not found" 
  //         });
  //       }

  //       // Check if property is still available before confirming
  //       const isStillAvailable = await Booking.checkAvailability(
  //         booking.property._id, 
  //         booking.checkIn, 
  //         booking.checkOut,
  //         booking._id // Exclude current booking from availability check
  //       );

  //       if (!isStillAvailable) {
  //         // Property is no longer available, initiate refund
  //         try {
  //           await paystack.initiateRefund(reference);
  //         } catch (refundError) {
  //           console.error('Refund initiation failed:', refundError);
  //         }
          
  //         // Update booking status
  //         booking.paymentStatus = 'refunded';
  //         booking.bookingStatus = 'cancelled';
  //         booking.cancellationReason = 'Property no longer available for selected dates';
  //         await booking.save();

  //         return res.status(400).json({
  //           success: false,
  //           message: "Property is no longer available for the selected dates. Your payment has been refunded.",
  //           refunded: true
  //         });
  //       }

  //       // Update booking status to confirmed
  //       booking.paymentStatus = 'paid';
  //       booking.bookingStatus = 'confirmed';
  //       booking.paymentData = verification;
  //       await booking.save();

  //       // Update property total bookings only after successful payment
  //       await Property.findByIdAndUpdate(booking.property._id, {
  //         $inc: { totalBookings: 1 }
  //       });

  //       // Send confirmation email
  //       try {
  //         await emailService.sendBookingConfirmation(booking);
  //       } catch (emailError) {
  //         console.error('Failed to send confirmation email:', emailError);
  //       }

  //       res.status(200).json({
  //         success: true,
  //         message: "Payment verified successfully and booking confirmed",
  //         booking,
  //         payment: verification
  //       });
  //     } else {
  //       // Payment failed, update booking status
  //       const booking = await Booking.findOne({ paystackReference: reference });
  //       if (booking) {
  //         booking.paymentStatus = 'failed';
  //         await booking.save();
  //       }

  //       res.status(400).json({ 
  //         success: false,
  //         message: "Payment verification failed",
  //         verification 
  //       });
  //     }

  //   } catch (error) {
  //     console.error('Verify payment error:', error);
  //     res.status(500).json({ 
  //       success: false,
  //       message: "Failed to verify payment", 
  //       error: error.message 
  //     });
  //   }
  // },

  // Verify payment - For Paystack payments only
  verifyPayment: async (req, res) => {
    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({ 
          success: false,
          message: "Payment reference is required" 
        });
      }

      // Find booking by reference
      const booking = await Booking.findOne({ paystackReference: reference })
        .populate('property')
        .populate('user');

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      // Check payment method
      if (booking.paymentMethod !== 'paystack') {
        return res.status(400).json({ 
          success: false,
          message: `This booking uses ${booking.paymentMethod} payment method` 
        });
      }

      // Verify payment with Paystack
      const verification = await paystack.verifyTransaction(reference);

      if (verification.status === 'success') {
        // Check if property is still available before confirming
        const isStillAvailable = await Booking.checkAvailability(
          booking.property._id, 
          booking.checkIn, 
          booking.checkOut,
          booking._id
        );

        if (!isStillAvailable) {
          // Property is no longer available, initiate refund
          try {
            await paystack.initiateRefund(reference);
          } catch (refundError) {
            console.error('Refund initiation failed:', refundError);
          }
          
          // Update booking status
          booking.paymentStatus = 'refunded';
          booking.bookingStatus = 'cancelled';
          booking.cancellationReason = 'Property no longer available for selected dates';
          await booking.save();

          return res.status(400).json({
            success: false,
            message: "Property is no longer available for the selected dates. Your payment has been refunded.",
            refunded: true
          });
        }

        // Update booking status to confirmed
        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'confirmed';
        booking.paymentData = verification;
        await booking.save();

        // Update property total bookings only after successful payment
        await Property.findByIdAndUpdate(booking.property._id, {
          $inc: { totalBookings: 1 }
        });

        // Send confirmation email
        try {
          await emailService.sendBookingConfirmation(booking);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        // Send admin notification
        try {
          await emailService.sendPaymentSuccessNotification(booking);
        } catch (emailError) {
          console.error('Failed to send admin notification:', emailError);
        }

        res.status(200).json({
          success: true,
          message: "Payment verified successfully and booking confirmed",
          booking,
          payment: verification
        });
      } else {
        // Payment failed, update booking status
        booking.paymentStatus = 'failed';
        await booking.save();

        res.status(400).json({ 
          success: false,
          message: "Payment verification failed",
          verification 
        });
      }

    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify payment", 
        error: error.message 
      });
    }
  },

  // Upload proof of payment for bank transfer
  // uploadProofOfPayment: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const proofFile = req.file;

  //     if (!proofFile) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Proof of payment file is required" 
  //       });
  //     }

  //     const booking = await Booking.findById(id)
  //       .populate('property', 'title')
  //       .populate('user', 'firstName lastName email');

  //     if (!booking) {
  //       return res.status(404).json({ 
  //         success: false,
  //         message: "Booking not found" 
  //       });
  //     }

  //     // Check if user owns booking
  //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
  //       return res.status(403).json({ 
  //         success: false,
  //         message: "Access denied" 
  //       });
  //     }

  //     // Check if booking is for bank transfer
  //     if (booking.paymentMethod !== 'bank_transfer') {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "This booking is not for bank transfer" 
  //       });
  //     }

  //     // Check if bank transfer details exist
  //     if (!booking.bankTransferDetails) {
  //       booking.bankTransferDetails = {
  //         accountName: 'Hols Apartments Ltd',
  //         accountNumber: '0900408855',
  //         bankName: 'GT Bank',
  //         transferReference: `TRF-${Date.now()}`,
  //         status: 'pending'
  //       };
  //     }

  //     // Update bank transfer details with proof
  //     booking.bankTransferDetails.proofOfPayment = `/uploads/payments/${proofFile.filename}`;
  //     booking.bankTransferDetails.status = 'pending';
  //     booking.paymentStatus = 'pending'; // Ensure it's pending for verification
  //     booking.bookingStatus = 'pending'; // Ensure booking is pending until verified
      
  //     await booking.save();

  //     // Notify admin about uploaded proof
  //     try {
  //       await emailService.sendPaymentProofNotification(booking);
  //     } catch (emailError) {
  //       console.error('Failed to send proof notification:', emailError);
  //     }

  //     // Send confirmation to user
  //     try {
  //       await emailService.sendProofUploadConfirmation(booking);
  //     } catch (emailError) {
  //       console.error('Failed to send upload confirmation:', emailError);
  //     }

  //     res.status(200).json({
  //       success: true,
  //       message: "Proof of payment uploaded successfully. Admin will verify your payment.",
  //       booking: {
  //         _id: booking._id,
  //         paymentStatus: booking.paymentStatus,
  //         bookingStatus: booking.bookingStatus,
  //         bankTransferDetails: booking.bankTransferDetails
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Upload proof error:', error);
      
  //     if (error.name === 'ValidationError') {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Validation error",
  //         error: error.message 
  //       });
  //     }
      
  //     res.status(500).json({ 
  //       success: false,
  //       message: "Failed to upload proof of payment", 
  //       error: error.message 
  //     });
  //   }
  // },

  // In bookingController.js - update the uploadProofOfPayment function
  uploadProofOfPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const proofFile = req.file;

      if (!proofFile) {
        return res.status(400).json({ 
          success: false,
          message: "Proof of payment file is required" 
        });
      }

      const booking = await Booking.findById(id)
        .populate('property', 'title')
        .populate('user', 'firstName lastName email');

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      // Check if user owns booking
      if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: "Access denied" 
        });
      }

      // Check if booking is for bank transfer
      if (booking.paymentMethod !== 'bank_transfer') {
        return res.status(400).json({ 
          success: false,
          message: "This booking is not for bank transfer" 
        });
      }

      // Handle file path for Vercel vs local
      let proofPath;
      if (process.env.VERCEL && proofFile.isVercel) {
        // On Vercel: File is in memory
        console.log('Vercel proof upload - storing in memory');
        proofPath = `/uploads/payments/${proofFile.filename}`;
        // In production, you would upload to cloud storage here
      } else {
        // Local: File is saved to disk
        proofPath = `/uploads/payments/${proofFile.filename}`;
      }

      // Initialize or update bank transfer details
      if (!booking.bankTransferDetails) {
        booking.bankTransferDetails = {
          accountName: 'Hols Apartments Ltd',
          accountNumber: '0900408855',
          bankName: 'GT Bank',
          transferReference: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending'
        };
      }

      // Update with proof path
      booking.bankTransferDetails.proofOfPayment = proofPath;
      booking.bankTransferDetails.status = 'pending';
      booking.paymentStatus = 'pending';
      booking.bookingStatus = 'pending';
      
      await booking.save();

      // Notify admin about uploaded proof
      try {
        await emailService.sendPaymentProofNotification(booking);
      } catch (emailError) {
        console.error('Failed to send proof notification:', emailError);
      }

      // Send confirmation to user
      try {
        await emailService.sendProofUploadConfirmation(booking);
      } catch (emailError) {
        console.error('Failed to send upload confirmation:', emailError);
      }

      res.status(200).json({
        success: true,
        message: "Proof of payment uploaded successfully. Admin will verify your payment.",
        booking: {
          _id: booking._id,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
          bankTransferDetails: booking.bankTransferDetails
        }
      });

    } catch (error) {
      console.error('Upload proof error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false,
          message: "Validation error",
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to upload proof of payment", 
        error: error.message 
      });
    }
  },

  // Admin: Verify bank transfer payment
  verifyBankTransfer: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'verified' or 'rejected'

      const booking = await Booking.findById(id)
        .populate('property')
        .populate('user');

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      if (booking.paymentMethod !== 'bank_transfer') {
        return res.status(400).json({ 
          success: false,
          message: "This booking is not for bank transfer" 
        });
      }

      if (status === 'verified') {
        // Check if property is still available
        const isStillAvailable = await Booking.checkAvailability(
          booking.property._id, 
          booking.checkIn, 
          booking.checkOut,
          booking._id
        );

        if (!isStillAvailable) {
          return res.status(400).json({
            success: false,
            message: "Property is no longer available for the selected dates."
          });
        }

        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'confirmed';
        booking.bankTransferDetails.status = 'verified';
        booking.bankTransferDetails.verifiedBy = req.user.id;
        booking.bankTransferDetails.verifiedAt = new Date();

        // Update property total bookings
        await Property.findByIdAndUpdate(booking.property._id, {
          $inc: { totalBookings: 1 }
        });

        // Send confirmation email
        try {
          await emailService.sendBookingConfirmation(booking);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

      } else if (status === 'rejected') {
        booking.bankTransferDetails.status = 'rejected';
        booking.paymentStatus = 'failed';
        
        // Send rejection email
        try {
          await emailService.sendPaymentRejectedNotification(booking);
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }

      await booking.save();

      res.status(200).json({
        success: true,
        message: `Payment ${status} successfully`,
        booking
      });

    } catch (error) {
      console.error('Verify bank transfer error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify payment", 
        error: error.message 
      });
    }
  },

  // Admin: Mark onsite payment as collected
  // markOnsitePaymentCollected: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { receiptNumber, collectedAt } = req.body;

  //     const booking = await Booking.findById(id)
  //       .populate('property')
  //       .populate('user');

  //     if (!booking) {
  //       return res.status(404).json({ 
  //         success: false,
  //         message: "Booking not found" 
  //       });
  //     }

  //     if (booking.paymentMethod !== 'onsite') {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "This booking is not for onsite payment" 
  //       });
  //     }

  //     // Check if property is still available
  //     const isStillAvailable = await Booking.checkAvailability(
  //       booking.property._id, 
  //       booking.checkIn, 
  //       booking.checkOut,
  //       booking._id
  //     );

  //     if (!isStillAvailable) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Property is no longer available for the selected dates."
  //       });
  //     }

  //     // Update onsite payment details
  //     booking.paymentStatus = 'paid';
  //     booking.bookingStatus = 'confirmed';
  //     booking.onsitePaymentDetails.status = 'collected';
  //     booking.onsitePaymentDetails.collectedBy = req.user.id;
  //     booking.onsitePaymentDetails.collectedAt = new Date(collectedAt) || new Date();
  //     booking.onsitePaymentDetails.receiptNumber = receiptNumber;

  //     // Update property total bookings
  //     await Property.findByIdAndUpdate(booking.property._id, {
  //       $inc: { totalBookings: 1 }
  //     });

  //     // Send confirmation email
  //     try {
  //       await emailService.sendBookingConfirmation(booking);
  //     } catch (emailError) {
  //       console.error('Failed to send confirmation email:', emailError);
  //     }

  //     await booking.save();

  //     res.status(200).json({
  //       success: true,
  //       message: "Onsite payment marked as collected",
  //       booking
  //     });

  //   } catch (error) {
  //     console.error('Mark onsite payment error:', error);
  //     res.status(500).json({ 
  //       success: false,
  //       message: "Failed to mark payment as collected", 
  //       error: error.message 
  //     });
  //   }
  // },

  // Admin: Mark onsite payment as collected - FIXED VERSION
// markOnsitePaymentCollected: async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { receiptNumber, collectedAt } = req.body;

//     const booking = await Booking.findById(id)
//       .populate('property')
//       .populate('user');

//     if (!booking) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Booking not found" 
//       });
//     }

//     if (booking.paymentMethod !== 'onsite') {
//       return res.status(400).json({ 
//         success: false,
//         message: "This booking is not for onsite payment" 
//       });
//     }

//     // Check if property is still available
//     const isStillAvailable = await Booking.checkAvailability(
//       booking.property._id, 
//       booking.checkIn, 
//       booking.checkOut,
//       booking._id
//     );

//     if (!isStillAvailable) {
//       return res.status(400).json({
//         success: false,
//         message: "Property is no longer available for the selected dates."
//       });
//     }

//     // Validate and parse collectedAt date
//     let collectedDate;
//     if (collectedAt) {
//       collectedDate = new Date(collectedAt);
//       if (isNaN(collectedDate.getTime())) {
//         return res.status(400).json({ 
//           success: false,
//           message: "Invalid date format for collectedAt. Use ISO format (YYYY-MM-DD)" 
//         });
//       }
//     } else {
//       collectedDate = new Date(); // Use current date if not provided
//     }

//     // Ensure onsitePaymentDetails exists
//     if (!booking.onsitePaymentDetails) {
//       booking.onsitePaymentDetails = {
//         expectedAmount: booking.totalAmount,
//         status: 'pending'
//       };
//     }

//     // Update onsite payment details - FIX: Create new object to avoid Mongoose casting issues
//     booking.paymentStatus = 'paid';
//     booking.bookingStatus = 'confirmed';
//     booking.onsitePaymentDetails = {
//       ...booking.onsitePaymentDetails, // Keep existing properties
//       status: 'collected',
//       collectedBy: req.user.id,
//       collectedAt: collectedDate,
//       receiptNumber: receiptNumber || `REC-${Date.now()}`
//     };

//     // Update property total bookings
//     await Property.findByIdAndUpdate(booking.property._id, {
//       $inc: { totalBookings: 1 }
//     });

//     // Send confirmation email
//     try {
//       await emailService.sendBookingConfirmation(booking);
//     } catch (emailError) {
//       console.error('Failed to send confirmation email:', emailError);
//     }

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: "Onsite payment marked as collected",
//       booking
//     });

//   } catch (error) {
//     console.error('Mark onsite payment error:', error);
    
//     // Handle specific validation errors
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         success: false,
//         message: "Validation failed",
//         errors: messages 
//       });
//     }
    
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to mark payment as collected", 
//       error: error.message 
//     });
//   }
// },

// Quick fix - Update markOnsitePaymentCollected function
markOnsitePaymentCollected: async (req, res) => {
  try {
    const { id } = req.params;
    const { receiptNumber, collectedAt } = req.body;

    const booking = await Booking.findById(id)
      .populate('property')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Booking not found" 
      });
    }

    if (booking.paymentMethod !== 'onsite') {
      return res.status(400).json({ 
        success: false,
        message: "This booking is not for onsite payment" 
      });
    }

    // Check if property is still available
    const isStillAvailable = await Booking.checkAvailability(
      booking.property._id, 
      booking.checkIn, 
      booking.checkOut,
      booking._id
    );

    if (!isStillAvailable) {
      return res.status(400).json({
        success: false,
        message: "Property is no longer available for the selected dates."
      });
    }

    // FIX: Handle date parsing properly
    let collectedDate;
    if (collectedAt) {
      collectedDate = new Date(collectedAt);
      // If date is invalid, use current date
      if (isNaN(collectedDate.getTime())) {
        collectedDate = new Date();
      }
    } else {
      collectedDate = new Date();
    }

    // Update onsite payment details
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    
    // Ensure onsitePaymentDetails exists as a plain object
    const onsiteDetails = booking.onsitePaymentDetails || {};
    onsiteDetails.status = 'collected';
    onsiteDetails.collectedBy = req.user.id;
    onsiteDetails.collectedAt = collectedDate;
    onsiteDetails.receiptNumber = receiptNumber || `REC-${Date.now()}`;
    
    // Set the updated object
    booking.onsitePaymentDetails = onsiteDetails;

    // Update property total bookings
    await Property.findByIdAndUpdate(booking.property._id, {
      $inc: { totalBookings: 1 }
    });

    // Send confirmation email
    try {
      await emailService.sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Onsite payment marked as collected",
      booking
    });

  } catch (error) {
    console.error('Mark onsite payment error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to mark payment as collected", 
      error: error.message 
    });
  }
},

  // Get user bookings
  getUserBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user.id })
        .populate('property', 'title location images price specifications type')
        .sort({ createdAt: -1 });

      res.status(200).json({ 
        success: true,
        bookings 
      });
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch bookings", 
        error: error.message 
      });
    }
  },

  // Get booking by ID
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findById(id)
        .populate('property')
        .populate('user', 'firstName lastName email phone');

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      // Check if user owns booking or is admin
      if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: "Access denied" 
        });
      }

      res.status(200).json({ 
        success: true,
        booking 
      });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch booking", 
        error: error.message 
      });
    }
  },

  // Cancel booking
  cancelBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      // Check if user owns booking
      if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: "Access denied" 
        });
      }

      // Check if booking can be cancelled
      if (booking.bookingStatus === 'cancelled') {
        return res.status(400).json({ 
          success: false,
          message: "Booking already cancelled" 
        });
      }

      if (booking.bookingStatus === 'completed') {
        return res.status(400).json({ 
          success: false,
          message: "Completed booking cannot be cancelled" 
        });
      }

      // Update booking status
      booking.bookingStatus = 'cancelled';
      booking.cancellationReason = cancellationReason;
      booking.cancelledAt = new Date();
      await booking.save();

      // Handle refund if payment was made
      if (booking.paymentStatus === 'paid' && booking.paystackReference) {
        try {
          await paystack.initiateRefund(booking.paystackReference);
        } catch (refundError) {
          console.error('Refund initiation failed:', refundError);
        }
      }

      res.status(200).json({ 
        success: true,
        message: "Booking cancelled successfully",
        booking 
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to cancel booking", 
        error: error.message 
      });
    }
  },

  // Get all bookings (admin only)
  getAllBookings: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const query = {};
      if (status) query.bookingStatus = status;

      const bookings = await Booking.find(query)
        .populate('property', 'title location')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(query);

      res.status(200).json({
        success: true,
        bookings,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch bookings", 
        error: error.message 
      });
    }
  },

  // Update booking status (admin only)
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found" 
        });
      }

      booking.bookingStatus = status;
      await booking.save();

      res.status(200).json({ 
        success: true,
        message: "Booking status updated successfully",
        booking 
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update booking status", 
        error: error.message 
      });
    }
  },


  // Clean up expired pending bookings (to be called by a cron job)
  cleanupExpiredBookings: async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
      const expiredBookings = await Booking.find({
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        createdAt: { $lt: thirtyMinutesAgo }
      });

      for (const booking of expiredBookings) {
        booking.bookingStatus = 'cancelled';
        booking.cancellationReason = 'Payment not completed within 30 minutes';
        await booking.save();
        console.log(`Cancelled expired booking: ${booking._id}`);
      }

      console.log(`Cleaned up ${expiredBookings.length} expired pending bookings`);
    } catch (error) {
      console.error('Error cleaning up expired bookings:', error);
    }
  }
};

module.exports = bookingController;

















// In bookingController.js - Update createBooking function
// createBooking: async (req, res) => {
//   try {
//     const {
//       propertyId,
//       checkIn,
//       checkOut,
//       guests,
//       specialRequests,
//       paymentMethod = 'paystack' // Add payment method
//     } = req.body;

//     // ... existing validation ...

//     // Create booking with payment method
//     const booking = new Booking({
//       property: propertyId,
//       user: req.user.id,
//       checkIn: new Date(checkIn),
//       checkOut: new Date(checkOut),
//       guests,
//       totalAmount,
//       serviceFee,
//       specialRequests,
//       paymentStatus: 'pending',
//       bookingStatus: 'pending',
//       paymentMethod, // Add payment method
//       paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//     });

//     // For bank transfer, initialize bank transfer details
//     if (paymentMethod === 'bank_transfer') {
//       booking.bankTransferDetails = {
//         accountName: 'Hols Apartments Ltd',
//         accountNumber: '0900408855',
//         bankName: 'GT Bank',
//         transferReference: `TRF-${Date.now()}`,
//         status: 'pending'
//       };
//     }

//     // For onsite payment, initialize onsite details
//     if (paymentMethod === 'onsite') {
//       booking.onsitePaymentDetails = {
//         expectedAmount: totalAmount,
//         status: 'pending'
//       };
//     }

//     await booking.save();

//     // Send email notification to admin about new booking
//     try {
//       await emailService.sendNewBookingNotification(booking);
//     } catch (emailError) {
//       console.error('Failed to send booking notification:', emailError);
//     }

//     res.status(201).json({
//       message: "Booking created successfully",
//       booking: await booking.populate(['property', 'user'])
//     });

//   } catch (error) {
//     console.error('Create booking error:', error);
//     res.status(500).json({ 
//       message: "Failed to create booking", 
//       error: error.message 
//     });
//   }
// },

// Add new route for bank transfer proof upload
// uploadProofOfPayment: async (req, res) => {
//   try {
//     const { id } = req.params;
//     const proofFile = req.file;

//     if (!proofFile) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Proof of payment file is required" 
//       });
//     }

//     const booking = await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Booking not found" 
//       });
//     }

//     // Check if user owns booking
//     if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
//       return res.status(403).json({ 
//         success: false,
//         message: "Access denied" 
//       });
//     }

//     // Check if booking is for bank transfer
//     if (booking.paymentMethod !== 'bank_transfer') {
//       return res.status(400).json({ 
//         success: false,
//         message: "This booking is not for bank transfer" 
//       });
//     }

//     // Update bank transfer details with proof
//     booking.bankTransferDetails.proofOfPayment = `/uploads/payments/${proofFile.filename}`;
//     booking.bankTransferDetails.status = 'pending';
//     booking.paymentStatus = 'pending'; // Reset to pending for verification
    
//     await booking.save();

//     // Notify admin about uploaded proof
//     try {
//       await emailService.sendPaymentProofNotification(booking);
//     } catch (emailError) {
//       console.error('Failed to send proof notification:', emailError);
//     }

//     res.status(200).json({
//       success: true,
//       message: "Proof of payment uploaded successfully. Admin will verify your payment.",
//       booking
//     });

//   } catch (error) {
//     console.error('Upload proof error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: "Failed to upload proof of payment", 
//       error: error.message 
//     });
//   }
// },


































































// const Booking = require("../Models/BookingModel");
// const Property = require("../Models/PropertyModel");
// const User = require("../Models/UserModel");
// const paystack = require("../Services/paystackService");
// const emailService = require("../Services/emailService");
// const mongoose = require("mongoose");

// const bookingController = {
//   // Check property availability
//   checkAvailability: async (req, res) => {
//     try {
//       const { propertyId } = req.params;
//       const { checkIn, checkOut } = req.query;

//       if (!checkIn || !checkOut) {
//         return res.status(400).json({ 
//           message: "Check-in and check-out dates are required" 
//         });
//       }

//       const isAvailable = await Booking.checkAvailability(
//         propertyId, 
//         checkIn, 
//         checkOut
//       ); 

//       res.status(200).json({ available: isAvailable });
//     } catch (error) {
//       console.error('Check availability error:', error);
//       res.status(500).json({ 
//         message: "Failed to check availability", 
//         error: error.message 
//       });
//     }
//   },

//   // Create booking
//   // createBooking: async (req, res) => {
//   //   try {
//   //     const {
//   //       propertyId,
//   //       checkIn,
//   //       checkOut,
//   //       guests,
//   //       specialRequests
//   //     } = req.body;

//   //     // Validate required fields
//   //     if (!propertyId || !checkIn || !checkOut || !guests) {
//   //       return res.status(400).json({ 
//   //         message: "Property ID, check-in, check-out, and guests are required" 
//   //       });
//   //     }

//   //     // Check if property exists and is active
//   //     const property = await Property.findById(propertyId);
//   //     if (!property || property.status !== 'active') {
//   //       return res.status(404).json({ message: "Property not available" });
//   //     }

//   //     // Check availability
//   //     const isAvailable = await Booking.checkAvailability(propertyId, checkIn, checkOut);
//   //     if (!isAvailable) {
//   //       return res.status(400).json({ message: "Property not available for selected dates" });
//   //     }

//   //     // Validate guests count
//   //     if (guests > property.specifications.maxGuests) {
//   //       return res.status(400).json({ 
//   //         message: `Maximum ${property.specifications.maxGuests} guests allowed` 
//   //       });
//   //     }

//   //     // Calculate total amount
//   //     const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
//   //     const baseAmount = property.price * nights;
//   //     const serviceFee = baseAmount * 0.1; // 10% service fee
//   //     const totalAmount = baseAmount + serviceFee;

//   //     // Create booking
//   //     const booking = new Booking({
//   //       property: propertyId,
//   //       user: req.user.id,
//   //       checkIn: new Date(checkIn),
//   //       checkOut: new Date(checkOut),
//   //       guests,
//   //       totalAmount,
//   //       serviceFee,
//   //       specialRequests,
//   //       paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//   //     });

//   //     await booking.save();

//   //     // Populate booking data for response
//   //     await booking.populate('property', 'title location images price specifications');
//   //     await booking.populate('user', 'firstName lastName email');

//   //     res.status(201).json({
//   //       message: "Booking created successfully",
//   //       booking
//   //     });

//   //   } catch (error) {
//   //     console.error('Create booking error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to create booking", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },

//   // controllers/bookingController.js - Update createBooking method  
//   createBooking: async (req, res) => {
//     try {
//       const {
//         propertyId,
//         checkIn,
//         checkOut,
//         guests,
//         specialRequests
//       } = req.body;

//       // Validate required fields
//       if (!propertyId || !checkIn || !checkOut || !guests) {
//         return res.status(400).json({ 
//           message: "Property ID, check-in, check-out, and guests are required" 
//         });
//       }

//       // Check if property exists and is active
//       const property = await Property.findById(propertyId);
//       if (!property || property.status !== 'active') {
//         return res.status(404).json({ message: "Property not available" });
//       }

//       // Check availability - only consider confirmed bookings
//       const isAvailable = await Booking.checkAvailability(propertyId, checkIn, checkOut);
//       if (!isAvailable) {
//         return res.status(400).json({ message: "Property not available for selected dates" });
//       }

//       // Validate guests count
//       if (guests > property.specifications.maxGuests) {
//         return res.status(400).json({ 
//           message: `Maximum ${property.specifications.maxGuests} guests allowed` 
//         });
//       }

//       // Calculate total amount
//       const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
//       const baseAmount = property.price * nights;
//       const serviceFee = baseAmount * 0.1; // 10% service fee
//       const totalAmount = baseAmount + serviceFee;

//       // Create booking with pending status
//       const booking = new Booking({
//         property: propertyId,
//         user: req.user.id,
//         checkIn: new Date(checkIn),
//         checkOut: new Date(checkOut),
//         guests,
//         totalAmount,
//         serviceFee,
//         specialRequests,
//         paymentStatus: 'pending',
//         bookingStatus: 'pending',
//         paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//       });

//       await booking.save();

//       // Populate booking data for response
//       await booking.populate('property', 'title location images price specifications');
//       await booking.populate('user', 'firstName lastName email');

//       res.status(201).json({
//         message: "Booking created successfully. Please complete payment to confirm your booking.",
//         booking
//       });

//     } catch (error) {
//       console.error('Create booking error:', error);
//       res.status(500).json({ 
//         message: "Failed to create booking", 
//         error: error.message 
//       });
//     }
//   },

  
//   // Update verifyPayment method
//   verifyPayment: async (req, res) => {
//     try {
//       const { reference } = req.body;

//       if (!reference) {
//         return res.status(400).json({ message: "Payment reference is required" });
//       }

//       // Verify payment with Paystack
//       const verification = await paystack.verifyTransaction(reference);

//       if (verification.status === 'success') {
//         // Find booking by reference
//         const booking = await Booking.findOne({ paystackReference: reference })
//           .populate('property')
//           .populate('user');

//         if (!booking) {
//           return res.status(404).json({ message: "Booking not found" });
//         }

//         // Check if property is still available before confirming
//         const isStillAvailable = await Booking.checkAvailability(
//           booking.property._id, 
//           booking.checkIn, 
//           booking.checkOut,
//           booking._id // Exclude current booking from availability check
//         );

//         if (!isStillAvailable) {
//           // Property is no longer available, initiate refund
//           await paystack.initiateRefund(reference);
          
//           // Update booking status
//           booking.paymentStatus = 'refunded';
//           booking.bookingStatus = 'cancelled';
//           booking.cancellationReason = 'Property no longer available for selected dates';
//           await booking.save();

//           return res.status(400).json({
//             message: "Property is no longer available for the selected dates. Your payment has been refunded.",
//             refunded: true
//           });
//         }

//         // Update booking status to confirmed
//         booking.paymentStatus = 'paid';
//         booking.bookingStatus = 'confirmed';
//         booking.paymentData = verification;
//         await booking.save();

//         // Update property total bookings only after successful payment
//         await Property.findByIdAndUpdate(booking.property._id, {
//           $inc: { totalBookings: 1 }
//         });

//         // Send confirmation email
//         await emailService.sendBookingConfirmation(booking);

//         res.status(200).json({
//           message: "Payment verified successfully and booking confirmed",
//           booking,
//           payment: verification
//         });
//       } else {
//         // Payment failed, update booking status
//         const booking = await Booking.findOne({ paystackReference: reference });
//         if (booking) {
//           booking.paymentStatus = 'failed';
//           await booking.save();
//         }

//         res.status(400).json({ 
//           message: "Payment verification failed",
//           verification 
//         });
//       }

//     } catch (error) {
//       console.error('Verify payment error:', error);
//       res.status(500).json({ 
//         message: "Failed to verify payment", 
//         error: error.message 
//       });
//     }
//   },
//   // Initialize payment
//   // initializePayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Initialize Paystack payment
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100, // Convert to kobo
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       }
//   //     });

//   //     // Update booking with Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Initialize payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to initialize payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },

//   // Add this to your bookingController.js
//   // retryPayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Generate new payment reference for retry
//   //     booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   //     booking.paystackReference = undefined;
//   //     await booking.save();

//   //     // Initialize Paystack payment with new reference
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100,
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       }
//   //     });

//   //     // Update booking with new Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment retry initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Retry payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to retry payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },

//   // In your bookingController.js, update the initializePayment function
//   // initializePayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Generate new payment reference if payment was previously initialized but failed
//   //     if (booking.paystackReference && booking.paymentStatus === 'pending') {
//   //       booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   //       booking.paystackReference = undefined; // Clear old Paystack reference
//   //       await booking.save();
//   //     }

//   //     // Initialize Paystack payment
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100, // Convert to kobo
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       }
//   //     });

//   //     // Update booking with Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Initialize payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to initialize payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },


//   // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@22
//   // In bookingController.js
//   // initializePayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Generate new payment reference if payment was previously initialized but failed
//   //     if (booking.paystackReference && booking.paymentStatus === 'pending') {
//   //       booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   //       booking.paystackReference = undefined; // Clear old Paystack reference
//   //       await booking.save();
//   //     }

//   //     // Initialize Paystack payment
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100, // Convert to kobo
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       }
//   //     });

//   //     // Update booking with Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Initialize payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to initialize payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },


  
//   // initializePayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Generate new payment reference if payment was previously initialized but failed
//   //     if (booking.paystackReference && booking.paymentStatus === 'pending') {
//   //       booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   //       booking.paystackReference = undefined; // Clear old Paystack reference
//   //       await booking.save();
//   //     }

//   //     // Initialize Paystack payment with BOOKING-specific callback URL
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100, // Convert to kobo
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       },
//   //       callback_url: `${process.env.CLIENT_URL}/booking/success` // BOOKING SPECIFIC URL
//   //     });

//   //     // Update booking with Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Initialize payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to initialize payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },

//   // In bookingController.js - update initializePayment function
//   // initializePayment: async (req, res) => {
//   //   try {
//   //     const { id } = req.params;
//   //     const { email } = req.body;

//   //     // Validate booking ID
//   //     if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
//   //       return res.status(400).json({ 
//   //         message: "Invalid booking ID" 
//   //       });
//   //     }

//   //     const booking = await Booking.findById(id)
//   //       .populate('property', 'title')
//   //       .populate('user', 'firstName lastName email');

//   //     if (!booking) {
//   //       return res.status(404).json({ message: "Booking not found" });
//   //     }

//   //     // Check if booking belongs to user
//   //     if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//   //       return res.status(403).json({ message: "Access denied" });
//   //     }

//   //     // Check if booking is already paid
//   //     if (booking.paymentStatus === 'paid') {
//   //       return res.status(400).json({ message: "Booking already paid" });
//   //     }

//   //     // Generate new payment reference if payment was previously initialized but failed
//   //     if (booking.paystackReference && booking.paymentStatus === 'pending') {
//   //       booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   //       booking.paystackReference = undefined; // Clear old Paystack reference
//   //       await booking.save();
//   //     }

//   //     // Initialize Paystack payment with BOOKING-specific callback URL
//   //     const paymentData = await paystack.initializeTransaction({
//   //       email: email || booking.user.email,
//   //       amount: booking.totalAmount * 100, // Convert to kobo
//   //       reference: booking.paymentReference,
//   //       metadata: {
//   //         bookingId: booking._id.toString(),
//   //         propertyTitle: booking.property.title,
//   //         customerName: `${booking.user.firstName} ${booking.user.lastName}`
//   //       },
//   //       callback_url: `${process.env.CLIENT_URL}/booking/success` // BOOKING SPECIFIC URL
//   //     });

//   //     // Update booking with Paystack reference
//   //     booking.paystackReference = paymentData.reference;
//   //     await booking.save();

//   //     res.status(200).json({
//   //       message: "Payment initialized successfully",
//   //       paymentData
//   //     });

//   //   } catch (error) {
//   //     console.error('Initialize payment error:', error);
      
//   //     // Handle specific MongoDB errors
//   //     if (error.name === 'CastError') {
//   //       return res.status(400).json({ 
//   //         message: "Invalid booking ID format" 
//   //       });
//   //     }
      
//   //     res.status(500).json({ 
//   //       message: "Failed to initialize payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },

//   // In bookingController.js - FIXED initializePayment function 
//   initializePayment: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { email } = req.body;

//       console.log('🎯 [Backend] Initialize payment called for booking:', id);

//       // Validate booking ID
//       if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ 
//           message: "Invalid booking ID" 
//         });
//       }

//       const booking = await Booking.findById(id)
//         .populate('property', 'title')
//         .populate('user', 'firstName lastName email');

//       if (!booking) {
//         console.log('❌ [Backend] Booking not found:', id);
//         return res.status(404).json({ message: "Booking not found" });
//       }

//       // Check if booking belongs to user
//       if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//         console.log('❌ [Backend] Access denied for user:', req.user.id);
//         return res.status(403).json({ message: "Access denied" });
//       }

//       // Check if booking is already paid
//       if (booking.paymentStatus === 'paid') {
//         console.log('ℹ️ [Backend] Booking already paid:', id);
//         return res.status(400).json({ message: "Booking already paid" });
//       }

//       // Generate new payment reference if payment was previously initialized but failed
//       if (booking.paystackReference && booking.paymentStatus === 'pending') {
//         booking.paymentReference = `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//         booking.paystackReference = undefined;
//         await booking.save();
//         console.log('🔄 [Backend] Generated new payment reference:', booking.paymentReference);
//       }

//       console.log('🎯 [Backend] Calling Paystack with:', {
//         email: email || booking.user.email,
//         amount: booking.totalAmount * 100,
//         reference: booking.paymentReference,
//         totalAmount: booking.totalAmount,
//         totalAmountInKobo: booking.totalAmount * 100
//       });

//       // Initialize Paystack payment
//       const paymentData = await paystack.initializeTransaction({
//         email: email || booking.user.email,
//         amount: booking.totalAmount * 100, // Convert to kobo
//         reference: booking.paymentReference,
//         metadata: {
//           bookingId: booking._id.toString(),
//           propertyTitle: booking.property.title,
//           customerName: `${booking.user.firstName} ${booking.user.lastName}`
//         },
//         callback_url: `${process.env.CLIENT_URL}/booking/success`
//       });

//       console.log('✅ [Backend] Paystack returned:', {
//         hasAuthorizationUrl: !!paymentData.authorization_url,
//         hasReference: !!paymentData.reference,
//         data: paymentData
//       });

//       // Check if Paystack returned valid data
//       if (!paymentData || !paymentData.authorization_url) {
//         console.error('❌ [Backend] Paystack returned invalid data:', paymentData);
//         return res.status(500).json({ 
//           message: "Payment gateway returned invalid response",
//           details: "No payment URL received from Paystack"
//         });
//       }

//       // Update booking with Paystack reference
//       booking.paystackReference = paymentData.reference;
//       await booking.save();

//       console.log('✅ [Backend] Payment initialized successfully for booking:', id);

//       res.status(200).json({
//         message: "Payment initialized successfully",
//         paymentData
//       });

//     } catch (error) {
//       console.error('💥 [Backend] Initialize payment error:', {
//         name: error.name,
//         message: error.message,
//         stack: error.stack
//       });
      
//       // Handle specific errors
//       if (error.name === 'CastError') {
//         return res.status(400).json({ 
//           message: "Invalid booking ID format" 
//         });
//       }
      
//       // Check if it's a Paystack error
//       if (error.message.includes('Paystack Error')) {
//         return res.status(400).json({ 
//           message: error.message 
//         });
//       }
      
//       res.status(500).json({ 
//         message: "Failed to initialize payment", 
//         error: error.message 
//       });
//     }
//   },
 
 

//   // Verify payment
//   // verifyPayment: async (req, res) => {
//   //   try {
//   //     const { reference } = req.body;

//   //     if (!reference) {
//   //       return res.status(400).json({ message: "Payment reference is required" });
//   //     }

//   //     // Verify payment with Paystack
//   //     const verification = await paystack.verifyTransaction(reference);

//   //     if (verification.status === 'success') {
//   //       // Find booking by reference
//   //       const booking = await Booking.findOne({ paystackReference: reference })
//   //         .populate('property')
//   //         .populate('user');

//   //       if (!booking) {
//   //         return res.status(404).json({ message: "Booking not found" });
//   //       }

//   //       // Update booking status
//   //       booking.paymentStatus = 'paid';
//   //       booking.bookingStatus = 'confirmed';
//   //       booking.paymentData = verification;
//   //       await booking.save();

//   //       // Update property total bookings
//   //       await Property.findByIdAndUpdate(booking.property._id, {
//   //         $inc: { totalBookings: 1 }
//   //       });

//   //       // Send confirmation email
//   //       await emailService.sendBookingConfirmation(booking);

//   //       res.status(200).json({
//   //         message: "Payment verified successfully",
//   //         booking,
//   //         payment: verification
//   //       });
//   //     } else {
//   //       res.status(400).json({ 
//   //         message: "Payment verification failed",
//   //         verification 
//   //       });
//   //     }

//   //   } catch (error) {
//   //     console.error('Verify payment error:', error);
//   //     res.status(500).json({ 
//   //       message: "Failed to verify payment", 
//   //       error: error.message 
//   //     });
//   //   }
//   // },
 
//   // Get user bookings
//   getUserBookings: async (req, res) => {
//     try {
//       const bookings = await Booking.find({ user: req.user.id })
//         .populate('property', 'title location images price specifications type')
//         .sort({ createdAt: -1 });

//       res.status(200).json({ bookings });
//     } catch (error) {
//       console.error('Get user bookings error:', error);
//       res.status(500).json({ 
//         message: "Failed to fetch bookings", 
//         error: error.message 
//       });
//     }
//   },

//   // Get booking by ID
//   getBookingById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const booking = await Booking.findById(id)
//         .populate('property')
//         .populate('user', 'firstName lastName email phone');

//       if (!booking) {
//         return res.status(404).json({ message: "Booking not found" });
//       }

//       // Check if user owns booking or is admin
//       if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: "Access denied" });
//       }

//       res.status(200).json({ booking });
//     } catch (error) {
//       console.error('Get booking error:', error);
//       res.status(500).json({ 
//         message: "Failed to fetch booking", 
//         error: error.message 
//       });
//     }
//   },

//   // Cancel booking
//   cancelBooking: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { cancellationReason } = req.body;

//       const booking = await Booking.findById(id);

//       if (!booking) {
//         return res.status(404).json({ message: "Booking not found" });
//       }

//       // Check if user owns booking
//       if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: "Access denied" });
//       }

//       // Check if booking can be cancelled
//       if (booking.bookingStatus === 'cancelled') {
//         return res.status(400).json({ message: "Booking already cancelled" });
//       }

//       if (booking.bookingStatus === 'completed') {
//         return res.status(400).json({ message: "Completed booking cannot be cancelled" });
//       }

//       // Update booking status
//       booking.bookingStatus = 'cancelled';
//       booking.cancellationReason = cancellationReason;
//       booking.cancelledAt = new Date();
//       await booking.save();

//       // TODO: Handle refund if payment was made
//       if (booking.paymentStatus === 'paid') {
//         // Initiate refund process
//         // await paystack.initiateRefund(booking.paystackReference);
//       }

//       res.status(200).json({ 
//         message: "Booking cancelled successfully",
//         booking 
//       });

//     } catch (error) {
//       console.error('Cancel booking error:', error);
//       res.status(500).json({ 
//         message: "Failed to cancel booking", 
//         error: error.message 
//       });
//     }
//   },

//   // Get all bookings (admin only)
//   getAllBookings: async (req, res) => {
//     try {
//       const { page = 1, limit = 20, status } = req.query;

//       const query = {};
//       if (status) query.bookingStatus = status;

//       const bookings = await Booking.find(query)
//         .populate('property', 'title location')
//         .populate('user', 'firstName lastName email')
//         .sort({ createdAt: -1 })
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await Booking.countDocuments(query);

//       res.status(200).json({
//         bookings,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });
//     } catch (error) {
//       console.error('Get all bookings error:', error);
//       res.status(500).json({ 
//         message: "Failed to fetch bookings", 
//         error: error.message 
//       });
//     }
//   },

//   // Update booking status (admin only)
//   updateBookingStatus: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status } = req.body;

//       const booking = await Booking.findById(id);

//       if (!booking) {
//         return res.status(404).json({ message: "Booking not found" });
//       }

//       booking.bookingStatus = status;
//       await booking.save();

//       res.status(200).json({ 
//         message: "Booking status updated successfully",
//         booking 
//       });

//     } catch (error) {
//       console.error('Update booking status error:', error);
//       res.status(500).json({ 
//         message: "Failed to update booking status", 
//         error: error.message 
//       });
//     }
//   },

//   // Add to bookingController.js
// // Clean up expired pending bookings (to be called by a cron job)
//   cleanupExpiredBookings: async () => {
//     try {
//       const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      
//       const expiredBookings = await Booking.find({
//         bookingStatus: 'pending',
//         paymentStatus: 'pending',
//         createdAt: { $lt: thirtyMinutesAgo }
//       });

//       for (const booking of expiredBookings) {
//         booking.bookingStatus = 'cancelled';
//         booking.cancellationReason = 'Payment not completed within 30 minutes';
//         await booking.save();
//         console.log(`Cancelled expired booking: ${booking._id}`);
//       }

//       console.log(`Cleaned up ${expiredBookings.length} expired pending bookings`);
//     } catch (error) {
//       console.error('Error cleaning up expired bookings:', error);
//     }
//   }
// };

// module.exports = bookingController;


































































