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


  // Create booking with corrected price calculation
  createBooking: async (req, res) => {
    try {
      const {
        propertyId,
        checkIn,
        checkOut,
        guests,
        specialRequests,
        paymentMethod = 'paystack'
      } = req.body;

      console.log('📝 [Backend] Creating booking with:', {
        propertyId,
        checkIn,
        checkOut,
        guests,
        paymentMethod
      });

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
          success: false,
          message: `Maximum ${property.specifications.maxGuests} guests allowed` 
        });
      }

      // Calculate total nights
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      
      console.log('📅 [Backend] Date calculation:', {
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        nights,
        diffMs: new Date(checkOut) - new Date(checkIn),
        diffDays: (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
      });

      // VALIDATION: Ensure minimum nights
      if (nights < 1) {
        return res.status(400).json({
          success: false,
          message: "Check-out date must be after check-in date"
        });
      }

      // Get property price breakdown
      // Use the virtual getter if available, otherwise calculate manually
      let propertyPriceBreakdown;
      
      if (property.priceBreakdown) {
        // Use existing price breakdown from property
        propertyPriceBreakdown = property.priceBreakdown;
        console.log('💰 [Backend] Using property.priceBreakdown:', propertyPriceBreakdown);
      } else {
        // Calculate manually
        const actualPrice = property.price;
        const utilityPercentage = property.utilityPercentage || 20;
        const serviceChargePercentage = property.serviceChargePercentage || 10;
        const vatPercentage = property.vatPercentage || 7.5;
        
        const utility = (actualPrice * utilityPercentage) / 100;
        const serviceCharge = (actualPrice * serviceChargePercentage) / 100;
        const accommodation = actualPrice - utility - serviceCharge;
        const vat = (accommodation * vatPercentage) / 100;
        const total = actualPrice + vat; // Actual + VAT on accommodation
        
        propertyPriceBreakdown = {
          actualPrice,
          utilityPercentage,
          utility,
          serviceChargePercentage,
          serviceCharge,
          accommodation,
          vatPercentage,
          vat,
          total
        };
        
        console.log('💰 [Backend] Calculated propertyPriceBreakdown:', propertyPriceBreakdown);
      }

      // Calculate booking price breakdown for ALL NIGHTS
      const bookingPriceBreakdown = {
        actualPrice: propertyPriceBreakdown.actualPrice * nights,
        utilityPercentage: property.utilityPercentage || 20,
        utility: propertyPriceBreakdown.utility * nights,
        serviceChargePercentage: property.serviceChargePercentage || 10,
        serviceCharge: propertyPriceBreakdown.serviceCharge * nights,
        accommodation: propertyPriceBreakdown.accommodation * nights,
        vatPercentage: property.vatPercentage || 7.5,
        vat: propertyPriceBreakdown.vat * nights,
        subtotal: propertyPriceBreakdown.actualPrice * nights, // Same as actualPrice * nights
        totalAmount: propertyPriceBreakdown.total * nights // (Actual + VAT) * nights
      };

      // DEBUG: Log the calculated breakdown
      console.log('🧮 [Backend] FINAL PRICE CALCULATION:', {
        nights,
        propertyPrice: property.price,
        propertyPriceBreakdown,
        
        // Per night breakdown
        perNight: {
          actualPrice: propertyPriceBreakdown.actualPrice,
          utility: propertyPriceBreakdown.utility,
          serviceCharge: propertyPriceBreakdown.serviceCharge,
          accommodation: propertyPriceBreakdown.accommodation,
          vat: propertyPriceBreakdown.vat,
          total: propertyPriceBreakdown.total
        },
        
        // Total for all nights
        totalForStay: {
          actualPrice: bookingPriceBreakdown.actualPrice,
          utility: bookingPriceBreakdown.utility,
          serviceCharge: bookingPriceBreakdown.serviceCharge,
          accommodation: bookingPriceBreakdown.accommodation,
          vat: bookingPriceBreakdown.vat,
          totalAmount: bookingPriceBreakdown.totalAmount
        },
        
        // Validate Paystack requirements
        paystackValidation: {
          totalNaira: bookingPriceBreakdown.totalAmount,
          totalKobo: Math.round(bookingPriceBreakdown.totalAmount * 100),
          meetsMinimum: bookingPriceBreakdown.totalAmount >= 1,
          isIntegerKobo: Number.isInteger(Math.round(bookingPriceBreakdown.totalAmount * 100))
        }
      });

      // VALIDATION: Ensure minimum amount for Paystack (if using paystack)
      if (paymentMethod === 'paystack' && bookingPriceBreakdown.totalAmount < 1) {
        console.error('❌ [Backend] Amount too small for Paystack:', bookingPriceBreakdown.totalAmount);
        return res.status(400).json({
          success: false,
          message: `Total amount (₦${bookingPriceBreakdown.totalAmount}) is less than minimum ₦1 required for payment. Please contact support.`
        });
      }

      // Create booking with price breakdown
      const booking = new Booking({
        property: propertyId,
        user: req.user.id,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        priceBreakdown: bookingPriceBreakdown,
        totalAmount: bookingPriceBreakdown.totalAmount, // Ensure this is set
        specialRequests: specialRequests || '',
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        paymentMethod,
        paymentReference: `HOLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // DEBUG: Log before saving
      console.log('💾 [Backend] Saving booking with:', {
        priceBreakdown: booking.priceBreakdown,
        totalAmount: booking.totalAmount,
        paymentReference: booking.paymentReference,
        paymentMethod: booking.paymentMethod,
        nights: nights
      });

      // For bank transfer, initialize bank transfer details
      if (paymentMethod === 'bank_transfer') {
        booking.bankTransferDetails = {
          accountName: 'Hols Apartments Ltd',
          accountNumber: '0094639347',
          bankName: 'Sterling Bank',
          transferReference: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending'
        };
        booking.bookingStatus = 'pending';
      }

      // For onsite payment, initialize onsite details
      if (paymentMethod === 'onsite') {
        booking.onsitePaymentDetails = {
          expectedAmount: bookingPriceBreakdown.totalAmount,
          status: 'pending'
        };
        booking.bookingStatus = 'pending';
      }

      await booking.save();

      // DEBUG: Verify saved booking
      const savedBooking = await Booking.findById(booking._id);
      console.log('✅ [Backend] Saved booking data:', {
        _id: savedBooking._id,
        priceBreakdown: savedBooking.priceBreakdown,
        totalAmount: savedBooking.totalAmount,
        paymentReference: savedBooking.paymentReference,
        paymentMethod: savedBooking.paymentMethod,
        checkIn: savedBooking.checkIn,
        checkOut: savedBooking.checkOut,
        nights: Math.ceil((new Date(savedBooking.checkOut) - new Date(savedBooking.checkIn)) / (1000 * 60 * 60 * 24))
      });

      // Populate booking data for response
      await booking.populate('property', 'title location images price specifications utilityPercentage serviceChargePercentage vatPercentage calculatedPrices');
      await booking.populate('user', 'firstName lastName email');

      // Send email notification to admin
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

      console.log('🎉 [Backend] Booking created successfully:', {
        bookingId: booking._id,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        nights: nights,
        priceBreakdown: booking.priceBreakdown
      });

      // Format the response
      const responseData = {
        success: true,
        message: successMessage,
        booking: {
          _id: booking._id,
          property: booking.property,
          user: booking.user,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          priceBreakdown: booking.priceBreakdown,
          totalAmount: booking.totalAmount,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
          paymentMethod: booking.paymentMethod,
          paymentReference: booking.paymentReference,
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt
        },
        paymentMethod,
        priceBreakdown: bookingPriceBreakdown
      };

      // Include bank details if payment method is bank transfer
      if (paymentMethod === 'bank_transfer') {
        responseData.bankDetails = booking.bankTransferDetails;
      }

      res.status(201).json(responseData);

    } catch (error) {
      console.error('💥 [Backend] Create booking error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.name === 'ValidationError' && { errors: error.errors })
      });
      
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
      
      // Handle duplicate payment reference
      if (error.code === 11000 && error.keyPattern?.paymentReference) {
        return res.status(400).json({
          success: false,
          message: "Payment reference already exists. Please try again."
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Failed to create booking", 
        error: error.message 
      });
    }
  },



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
      .populate('property', 'title price')
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

    // Check payment method
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

    // Get the amount from priceBreakdown
    let totalAmountNaira = 0;
    
    if (booking.priceBreakdown && booking.priceBreakdown.totalAmount) {
      totalAmountNaira = booking.priceBreakdown.totalAmount;
      console.log('💰 [Backend] Using priceBreakdown.totalAmount:', totalAmountNaira);
    } else if (booking.totalAmount) {
      totalAmountNaira = booking.totalAmount;
      console.log('💰 [Backend] Using booking.totalAmount:', totalAmountNaira);
    } else {
      console.error('❌ [Backend] No amount found in booking');
      return res.status(400).json({ 
        success: false,
        message: "Booking amount not found" 
      });
    }
    
    // CRITICAL FIX: Validate and format amount
    // 1. Ensure it's a number
    if (typeof totalAmountNaira !== 'number' || isNaN(totalAmountNaira) || !isFinite(totalAmountNaira)) {
      console.error('❌ [Backend] Invalid amount:', totalAmountNaira);
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment amount" 
      });
    }
    
    // 2. Round to 2 decimal places to avoid floating point issues
    totalAmountNaira = Math.round(totalAmountNaira * 100) / 100;
    
    // 3. Convert to kobo (Multiply by 100) - THIS IS CRITICAL
    let totalAmountInKobo = Math.round(totalAmountNaira * 100);
    
    // CRITICAL DEBUG: Show conversion
    console.log('💰 [Backend] AMOUNT CONVERSION:', {
      bookingId: booking._id,
      
      // Your example: ₦157,875
      nairaAmount: totalAmountNaira,
      koboAmount: totalAmountInKobo,
      
      // Show the exact calculation
      calculation: `${totalAmountNaira} × 100 = ${totalAmountInKobo}`,
      
      // Example: ₦157,875 → 15,787,500 kobo
      exampleConversion: `₦${totalAmountNaira} → ${totalAmountInKobo} kobo`,
      
      // Validation
      isInteger: Number.isInteger(totalAmountInKobo),
      isPositive: totalAmountInKobo > 0,
      meetsMinimum: totalAmountInKobo >= 100,
      
      // For your specific example:
      yourExample: '₦157,875 should be: 157875 × 100 = 15,787,500 kobo'
    });

    // VALIDATION: Ensure amount is integer in kobo
    if (!Number.isInteger(totalAmountInKobo)) {
      console.error('❌ [Backend] Amount in kobo is not integer:', {
        naira: totalAmountNaira,
        kobo: totalAmountInKobo,
        calculation: `${totalAmountNaira} × 100 = ${totalAmountNaira * 100}`
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid amount conversion. Amount must be whole number in kobo.'
      });
    }

    // VALIDATION: Minimum amount (₦1 = 100 kobo)
    if (totalAmountInKobo < 100) {
      console.error('❌ [Backend] Amount too small:', {
        naira: totalAmountNaira,
        kobo: totalAmountInKobo,
        minRequired: 100
      });
      return res.status(400).json({
        success: false,
        message: `Amount (₦${totalAmountNaira}) is too small. Minimum is ₦1.`
      });
    }

    // VALIDATION: Check if amount is ridiculously large (potential double conversion)
    if (totalAmountInKobo > 1000000000) { // 10 million Naira
      console.error('❌ [Backend] Amount suspiciously large:', {
        naira: totalAmountNaira,
        kobo: totalAmountInKobo,
        warning: 'Possible double conversion (naira × 100 × 100)'
      });
      return res.status(400).json({
        success: false,
        message: `Amount error. Please check calculation: ₦${totalAmountNaira} should be ${totalAmountInKobo} kobo`
      });
    }

    console.log('🎯 [Backend] Calling Paystack with:', {
      email: email || booking.user.email,
      amountInKobo: totalAmountInKobo,
      amountInNaira: totalAmountNaira,
      reference: booking.paymentReference,
      conversion: `${totalAmountNaira} NGN = ${totalAmountInKobo} kobo`,
      bookingId: booking._id
    });

    try {
      // Initialize Paystack payment - amount MUST be in kobo
      const paymentData = await paystack.initializeTransaction({
        email: email || booking.user.email,
        amount: totalAmountInKobo,  // THIS MUST BE IN KOBO (15787500 for ₦157,875)
        reference: booking.paymentReference,
        metadata: {
          bookingId: booking._id.toString(),
          propertyTitle: booking.property?.title || 'Unknown Property',
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          paymentMethod: 'paystack',
          totalAmountNaira: totalAmountNaira,
          totalAmountKobo: totalAmountInKobo
        },
        callback_url: `${process.env.CLIENT_URL}/booking/success`
      });

      console.log('✅ [Backend] Paystack response received:', {
        hasAuthorizationUrl: !!paymentData?.authorization_url,
        reference: paymentData?.reference
      });

      if (!paymentData || !paymentData.authorization_url) {
        console.error('❌ [Backend] Invalid Paystack response:', paymentData);
        return res.status(500).json({ 
          success: false,
          message: "Payment gateway error" 
        });
      }

      // Update booking with Paystack reference
      booking.paystackReference = paymentData.reference;
      await booking.save();

      console.log('✅ [Backend] Payment initialized successfully:', {
        bookingId: booking._id,
        amountNaira: totalAmountNaira,
        amountKobo: totalAmountInKobo,
        reference: paymentData.reference,
        authorizationUrl: paymentData.authorization_url
      });

      // Return response
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        authorization_url: paymentData.authorization_url,
        reference: paymentData.reference,
        access_code: paymentData.access_code,
        amount: totalAmountNaira,
        amountInKobo: totalAmountInKobo,
        bookingId: booking._id
      });

    } catch (paystackError) {
      console.error('💥 [Backend] Paystack API Error:', {
        message: paystackError.message,
        response: paystackError.response?.data,
        status: paystackError.response?.status
      });
      
      // Update booking status
      booking.paymentStatus = 'failed';
      await booking.save();
      
      // Check for specific Paystack errors
      const paystackResponse = paystackError.response?.data;
      
      if (paystackResponse?.message?.includes('Invalid Amount')) {
        console.error('🔍 [Backend] INVALID AMOUNT ERROR DETAILS:', {
          // What we sent
          sentAmountKobo: totalAmountInKobo,
          sentAmountNaira: totalAmountNaira,
          
          // For debugging
          conversionCheck: {
            expected: `₦${totalAmountNaira} → ${totalAmountNaira * 100} kobo`,
            actualSent: `${totalAmountInKobo} kobo`,
            calculation: `${totalAmountNaira} × 100 = ${totalAmountInKobo}`,
            isCorrect: totalAmountInKobo === totalAmountNaira * 100
          },
          
          // Paystack response
          paystackError: paystackResponse
        });
        
        // Provide clear error message
        let errorMessage = `Payment amount error. We sent ${totalAmountInKobo} kobo (₦${totalAmountNaira}). `;
        
        // Check for common mistakes
        if (totalAmountInKobo === totalAmountNaira) {
          errorMessage += "ERROR: Amount was NOT converted to kobo (should be naira × 100).";
        } else if (totalAmountInKobo === totalAmountNaira * 10000) {
          errorMessage += "ERROR: Double conversion detected (naira × 100 × 100).";
        } else {
          errorMessage += "Please verify the amount is correctly converted to kobo.";
        }
        
        return res.status(400).json({ 
          success: false,
          message: errorMessage,
          details: {
            nairaAmount: totalAmountNaira,
            koboAmountSent: totalAmountInKobo,
            expectedKobo: totalAmountNaira * 100,
            paystackError: paystackResponse?.message
          }
        });
      }
      
      // Generic error
      return res.status(400).json({ 
        success: false,
        message: paystackError.message || 'Payment initialization failed'
      });
    }

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
    
    res.status(500).json({ 
      success: false,
      message: "Failed to initialize payment",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
},

  

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

      // Get URL from Cloudinary or fallback to path
      const proofUrl = proofFile.cloudinary?.url || proofFile.path;
      
      console.log('Processing payment proof:', {
        originalName: proofFile.originalname,
        cloudinaryUrl: proofFile.cloudinary?.url,
        localPath: proofFile.path,
        finalUrl: proofUrl
      });

      // Initialize or update bank transfer details
      if (!booking.bankTransferDetails) {
        booking.bankTransferDetails = {
          accountName: 'Hols Apartments Ltd',
          accountNumber: '0094639347',
          bankName: 'Sterling Bank',
          transferReference: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending'
        };
      }

      // Update with proof URL (Cloudinary or local)
      booking.bankTransferDetails.proofOfPayment = proofUrl;
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


































































