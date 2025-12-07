const VendorOrder = require("../Models/VendorOrderModel");
const { Vendor, VendorProduct } = require("../Models/VendorModel");
const Booking = require("../Models/BookingModel");
const paystack = require("../Services/paystackService");
const emailService = require("../Services/emailService");

const vendorOrderController = {
  // Create vendor order
//   createOrder: async (req, res) => {
//     try {
//       const {
//         bookingId,
//         vendorId,
//         items,
//         deliveryAddress,
//         preferredDeliveryTime,
//         customerNotes
//       } = req.body;

//       // Validate booking exists and belongs to user
//       const booking = await Booking.findOne({ 
//         _id: bookingId, 
//         user: req.user.id 
//       }).populate('property');

//       if (!booking) {
//         return res.status(404).json({ message: "Booking not found" });
//       }

//       // Validate vendor exists and is active
//       const vendor = await Vendor.findOne({ _id: vendorId, status: 'active' });
//       if (!vendor) {
//         return res.status(404).json({ message: "Vendor not found or inactive" });
//       }

//       // Validate and calculate order items
//       let subtotal = 0;
//       const orderItems = [];

//       for (const item of items) {
//         const product = await VendorProduct.findOne({
//           _id: item.productId,
//           vendor: vendorId,
//           isAvailable: true
//         });

//         if (!product) {
//           return res.status(400).json({ 
//             message: `Product ${item.productId} not found or unavailable` 
//           });
//         }

//         if (item.quantity < product.minOrderQuantity || item.quantity > product.maxOrderQuantity) {
//           return res.status(400).json({ 
//             message: `Quantity for ${product.name} must be between ${product.minOrderQuantity} and ${product.maxOrderQuantity}` 
//           });
//         }

//         if (product.stockQuantity < item.quantity) {
//           return res.status(400).json({ 
//             message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available` 
//           });
//         }

//         const itemTotal = product.price * item.quantity;
//         subtotal += itemTotal;

//         orderItems.push({
//           product: product._id,
//           quantity: item.quantity,
//           price: product.price,
//           specialInstructions: item.specialInstructions
//         });
//       }

//       // Calculate fees
//       const serviceFee = subtotal * 0.1; // 10% service fee
//       const deliveryFee = 500; // Fixed delivery fee (could be dynamic based on location)
//       const totalAmount = subtotal + serviceFee + deliveryFee;

//       // Create order
//       const order = new VendorOrder({
//         user: req.user.id,
//         booking: bookingId,
//         vendor: vendorId,
//         items: orderItems,
//         subtotal,
//         serviceFee,
//         deliveryFee,
//         totalAmount,
//         deliveryAddress: {
//           property: booking.property.title,
//           unit: booking.property.location,
//           specialInstructions: deliveryAddress?.specialInstructions || ''
//         },
//         preferredDeliveryTime: preferredDeliveryTime ? new Date(preferredDeliveryTime) : null,
//         customerNotes,
//         paymentReference: `VENDOR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//       });

//       await order.save();

//       const populatedOrder = await VendorOrder.findById(order._id)
//         .populate('user', 'firstName lastName email phone')
//         .populate('vendor', 'businessName contactPerson')
//         .populate('booking', 'checkIn checkOut')
//         .populate('items.product', 'name description images preparationTime');

//       res.status(201).json({
//         message: "Order created successfully. Please complete payment.",
//         order: populatedOrder
//       });

//     } catch (error) {
//       console.error('Create vendor order error:', error);
//       res.status(500).json({ 
//         message: "Failed to create order", 
//         error: error.message 
//       });
//     }
//   },

    // createOrder: async (req, res) => {
    //     try {
    //     const {
    //         bookingId,
    //         vendorId,
    //         items,
    //         deliveryAddress,
    //         preferredDeliveryTime,
    //         customerNotes
    //     } = req.body;

    //     console.log('Creating vendor order with data:', {
    //         bookingId,
    //         vendorId,
    //         itemsCount: items?.length,
    //         deliveryAddress,
    //         user: req.user.id
    //     });

    //     // Validate booking exists and belongs to user
    //     const booking = await Booking.findOne({ 
    //         _id: bookingId, 
    //         user: req.user.id 
    //     }).populate('property');

    //     if (!booking) {
    //         return res.status(404).json({ message: "Booking not found" });
    //     }

    //     // Validate vendor exists and is active
    //     const vendor = await Vendor.findOne({ _id: vendorId, status: 'active' });
    //     if (!vendor) {
    //         return res.status(404).json({ message: "Vendor not found or inactive" });
    //     }

    //     // Validate and calculate order items
    //     let subtotal = 0;
    //     const orderItems = [];

    //     for (const item of items) {
    //         const product = await VendorProduct.findOne({
    //         _id: item.productId,
    //         vendor: vendorId,
    //         isAvailable: true
    //         });

    //         if (!product) {
    //         return res.status(400).json({ 
    //             message: `Product ${item.productId} not found or unavailable` 
    //         });
    //         }

    //         if (item.quantity < product.minOrderQuantity || item.quantity > product.maxOrderQuantity) {
    //         return res.status(400).json({ 
    //             message: `Quantity for ${product.name} must be between ${product.minOrderQuantity} and ${product.maxOrderQuantity}` 
    //         });
    //         }

    //         if (product.stockQuantity < item.quantity) {
    //         return res.status(400).json({ 
    //             message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available` 
    //         });
    //         }

    //         const itemTotal = product.price * item.quantity;
    //         subtotal += itemTotal;

    //         orderItems.push({
    //         product: product._id,
    //         quantity: item.quantity,
    //         price: product.price,
    //         specialInstructions: item.specialInstructions
    //         });
    //     }

    //     // Calculate fees
    //     const serviceFee = subtotal * 0.1; // 10% service fee
    //     const deliveryFee = 500; // Fixed delivery fee
    //     const totalAmount = subtotal + serviceFee + deliveryFee;

    //     // Generate payment reference
    //     const paymentReference = `VENDOR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    //     // Create order - orderNumber will be auto-generated by pre-save hook
    //     const order = new VendorOrder({
    //         user: req.user.id,
    //         booking: bookingId,
    //         vendor: vendorId,
    //         items: orderItems,
    //         subtotal,
    //         serviceFee,
    //         deliveryFee,
    //         totalAmount,
    //         deliveryAddress: {
    //         property: booking.property.title,
    //         unit: booking.property.location,
    //         specialInstructions: deliveryAddress?.specialInstructions || ''
    //         },
    //         preferredDeliveryTime: preferredDeliveryTime ? new Date(preferredDeliveryTime) : null,
    //         customerNotes,
    //         paymentReference
    //     });

    //     console.log('Saving vendor order...');
    //     await order.save();
    //     console.log('Vendor order saved successfully with orderNumber:', order.orderNumber);

    //     // Populate the order for response
    //     const populatedOrder = await VendorOrder.findById(order._id)
    //         .populate('user', 'firstName lastName email phone')
    //         .populate('vendor', 'businessName contactPerson')
    //         .populate('booking', 'checkIn checkOut')
    //         .populate('items.product', 'name description images preparationTime');

    //     res.status(201).json({
    //         success: true,
    //         message: "Order created successfully. Please complete payment.",
    //         order: populatedOrder
    //     });

    //     } catch (error) {
    //     console.error('Create vendor order error:', error);
        
    //     // Better error handling
    //     if (error.name === 'ValidationError') {
    //         const errors = Object.values(error.errors).map(err => err.message);
    //         return res.status(400).json({
    //         success: false,
    //         message: "Validation failed",
    //         errors: errors
    //         });
    //     }

    //     res.status(500).json({ 
    //         success: false,
    //         message: "Failed to create order", 
    //         error: error.message 
    //     });
    //     }
    // },


    
  createOrder: async (req, res) => {
    try {
      const {
        bookingId,
        vendorId,
        items,
        deliveryAddress,
        preferredDeliveryTime,
        customerNotes
      } = req.body;

      console.log('=== CREATE VENDOR ORDER REQUEST ===');
      console.log('User:', req.user.id);
      console.log('Booking ID:', bookingId);
      console.log('Vendor ID:', vendorId);
      console.log('Items count:', items?.length);

      // Validate required fields
      if (!bookingId || !vendorId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Booking ID, vendor ID, and items are required" 
        });
      }

      // Validate booking exists and belongs to user
      const booking = await Booking.findOne({ 
        _id: bookingId, 
        user: req.user.id 
      }).populate('property');

      if (!booking) {
        return res.status(404).json({ 
          success: false,
          message: "Booking not found or access denied" 
        });
      }

      // Validate vendor exists and is active
      const vendor = await Vendor.findOne({ _id: vendorId, status: 'active' });
      if (!vendor) {
        return res.status(404).json({ 
          success: false,
          message: "Vendor not found or inactive" 
        });
      }

      // Validate and calculate order items
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        if (!item.productId || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Each item must have productId and quantity"
          });
        }

        const product = await VendorProduct.findOne({
          _id: item.productId,
          vendor: vendorId,
          isAvailable: true
        });

        if (!product) {
          return res.status(400).json({ 
            success: false,
            message: `Product ${item.productId} not found or unavailable` 
          });
        }

        if (item.quantity < product.minOrderQuantity || item.quantity > product.maxOrderQuantity) {
          return res.status(400).json({ 
            success: false,
            message: `Quantity for ${product.name} must be between ${product.minOrderQuantity} and ${product.maxOrderQuantity}` 
          });
        }

        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({ 
            success: false,
            message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available` 
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
          specialInstructions: item.specialInstructions
        });
      }

      // Calculate fees
      const serviceFee = subtotal * 0.1;
      const deliveryFee = 500;
      const totalAmount = subtotal + serviceFee + deliveryFee;

      // Generate payment reference
      const paymentReference = `VENDOR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // MANUALLY generate order number as fallback
      const manualOrderNumber = `VOR-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      console.log('Manually generated order number:', manualOrderNumber);

      // Create order data
      const orderData = {
        user: req.user.id,
        booking: bookingId,
        vendor: vendorId,
        items: orderItems,
        subtotal,
        serviceFee,
        deliveryFee,
        totalAmount,
        deliveryAddress: {
          property: booking.property.title,
          unit: booking.property.location,
          specialInstructions: deliveryAddress?.specialInstructions || ''
        },
        preferredDeliveryTime: preferredDeliveryTime ? new Date(preferredDeliveryTime) : null,
        customerNotes,
        paymentReference,
        orderNumber: manualOrderNumber // Force set order number
      };

      console.log('Order data before save:', {
        orderNumber: orderData.orderNumber,
        user: orderData.user,
        vendor: orderData.vendor,
        itemCount: orderData.items.length
      });

      // Create and save order
      const order = new VendorOrder(orderData);
      
      console.log('Order instance before save:', {
        orderNumber: order.orderNumber,
        isNew: order.isNew
      });

      await order.save();

      console.log('Order saved successfully:', {
        orderNumber: order.orderNumber,
        _id: order._id
      });

      // Populate the order for response
      const populatedOrder = await VendorOrder.findById(order._id)
        .populate('user', 'firstName lastName email phone')
        .populate('vendor', 'businessName contactPerson')
        .populate('booking', 'checkIn checkOut')
        .populate('items.product', 'name description images preparationTime');

      res.status(201).json({
        success: true,
        message: "Order created successfully. Please complete payment.",
        order: populatedOrder
      });

    } catch (error) {
      console.error('=== CREATE VENDOR ORDER ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        console.error('Validation errors:', errors);
        
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors
        });
      }

      // Handle duplicate key error (orderNumber unique constraint)
      if (error.code === 11000) {
        console.error('Duplicate order number error:', error.keyValue);
        return res.status(400).json({
          success: false,
          message: "Order number already exists. Please try again.",
          error: "Duplicate order number"
        });
      }

      res.status(500).json({ 
        success: false,
        message: "Failed to create order", 
        error: error.message 
      });
    }
  },
 

  // Initialize payment for vendor order
//   initializePayment: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { email } = req.body;

//       const order = await VendorOrder.findById(id)
//         .populate('user', 'firstName lastName email')
//         .populate('vendor', 'businessName');

//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }

//       // Check if order belongs to user
//       if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: "Access denied" });
//       }

//       // Check if order is already paid
//       if (order.paymentStatus === 'paid') {
//         return res.status(400).json({ message: "Order already paid" });
//       }

//       // Initialize Paystack payment
//     //   const paymentData = await paystack.initializeTransaction({
//     //     email: email || order.user.email,
//     //     amount: order.totalAmount * 100, // Convert to kobo
//     //     reference: order.paymentReference,
//     //     metadata: {
//     //       orderId: order._id.toString(),
//     //       orderType: 'vendor',
//     //       vendorName: order.vendor.businessName,
//     //       customerName: `${order.user.firstName} ${order.user.lastName}`
//     //     }
//     //   });

//       // In vendorOrderController.js - initializePayment method
//         const paymentData = await paystack.initializeTransaction({
//         email: email || order.user.email,
//         amount: order.totalAmount * 100,
//         reference: order.paymentReference,
//         metadata: {
//             orderId: order._id.toString(),
//             orderType: 'vendor', // Add this to distinguish from booking payments
//             vendorName: order.vendor.businessName,
//             customerName: `${order.user.firstName} ${order.user.lastName}`
//         },
//         callback_url: `${process.env.CLIENT_URL}/vendor/payment/success` // Specific vendor success page
//         });

//       // Update order with Paystack reference
//       order.paystackReference = paymentData.reference;
//       await order.save();

//       res.status(200).json({
//         message: "Payment initialized successfully",
//         paymentData
//       });

//     } catch (error) {
//       console.error('Initialize vendor payment error:', error);
//       res.status(500).json({ 
//         message: "Failed to initialize payment", 
//         error: error.message 
//       });
//     }
//   },


  

  initializePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const order = await VendorOrder.findById(id)
        .populate('user', 'firstName lastName email')
        .populate('vendor', 'businessName');

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order belongs to user
      if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if order is already paid
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ message: "Order already paid" });
      }

      // Initialize Paystack payment with VENDOR-specific callback URL
      const paymentData = await paystack.initializeTransaction({
        email: email || order.user.email,
        amount: order.totalAmount * 100, // Convert to kobo
        reference: order.paymentReference,
        metadata: {
          orderId: order._id.toString(),
          orderType: 'vendor',
          vendorName: order.vendor.businessName,
          customerName: `${order.user.firstName} ${order.user.lastName}`
        },
        callback_url: `${process.env.CLIENT_URL}/vendor/payment/success` // VENDOR SPECIFIC URL
      });

      // Update order with Paystack reference
      order.paystackReference = paymentData.reference;
      await order.save();

      res.status(200).json({
        message: "Payment initialized successfully",
        paymentData
      });

    } catch (error) {
      console.error('Initialize vendor payment error:', error);
      res.status(500).json({ 
        message: "Failed to initialize payment", 
        error: error.message 
      });
    }
  },
 

  // Verify vendor order payment
//   verifyPayment: async (req, res) => {
//     try {
//       const { reference } = req.body;

//       if (!reference) {
//         return res.status(400).json({ message: "Payment reference is required" });
//       }

//       // Verify payment with Paystack
//       const verification = await paystack.verifyTransaction(reference);

//       if (verification.status === 'success') {
//         const order = await VendorOrder.findOne({ paystackReference: reference })
//           .populate('user', 'firstName lastName email phone')
//           .populate('vendor', 'businessName contactPerson')
//           .populate('booking', 'property checkIn checkOut')
//           .populate('items.product', 'name description images preparationTime stockQuantity');

//         if (!order) {
//           return res.status(404).json({ message: "Order not found" });
//         }

//         // Update order status
//         order.paymentStatus = 'paid';
//         order.orderStatus = 'confirmed';
//         order.paymentData = verification;
//         await order.save();

//         // Update vendor stats
//         await Vendor.findByIdAndUpdate(order.vendor._id, {
//           $inc: { totalOrders: 1 }
//         });

//         // Update product stock quantities
//         for (const item of order.items) {
//           await VendorProduct.findByIdAndUpdate(
//             item.product._id,
//             { $inc: { stockQuantity: -item.quantity } }
//           );
//         }

//         // Send confirmation emails
//         await emailService.sendVendorOrderConfirmation(order);
//         await emailService.sendVendorOrderNotification(order);

//         res.status(200).json({
//           message: "Payment verified successfully and order confirmed",
//           order,
//           payment: verification
//         });
//       } else {
//         // Payment failed
//         const order = await VendorOrder.findOne({ paystackReference: reference });
//         if (order) {
//           order.paymentStatus = 'failed';
//           await order.save();
//         }

//         res.status(400).json({ 
//           message: "Payment verification failed",
//           verification 
//         });
//       }

//     } catch (error) {
//       console.error('Verify vendor payment error:', error);
//       res.status(500).json({ 
//         message: "Failed to verify payment", 
//         error: error.message 
//       });
//     }
//   },


  verifyPayment: async (req, res) => {
    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({ 
          success: false,
          message: "Payment reference is required" 
        });
      }

      // Verify payment with Paystack
      const verification = await paystack.verifyTransaction(reference);

      if (verification.status === 'success') {
        const order = await VendorOrder.findOne({ paystackReference: reference })
          .populate('user', 'firstName lastName email phone')
          .populate('vendor', 'businessName contactPerson')
          .populate('booking', 'property checkIn checkOut')
          .populate('items.product', 'name description images preparationTime stockQuantity');

        if (!order) {
          return res.status(404).json({ 
            success: false,
            message: "Order not found" 
          });
        }

        // Update order status
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.paymentData = verification;
        await order.save();

        // Update vendor stats
        await Vendor.findByIdAndUpdate(order.vendor._id, {
          $inc: { totalOrders: 1 }
        });

        // Update product stock quantities
        for (const item of order.items) {
          await VendorProduct.findByIdAndUpdate(
            item.product._id,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }

        // Send confirmation emails
        await emailService.sendVendorOrderConfirmation(order);
        await emailService.sendVendorOrderNotification(order);

        return res.status(200).json({
          success: true, // Make sure this is true
          message: "Payment verified successfully and order confirmed",
          order: order
        });
      } else {
        // Payment failed
        const order = await VendorOrder.findOne({ paystackReference: reference });
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
        }

        return res.status(400).json({ 
          success: false, // Make sure this is false
          message: "Payment verification failed",
          verification 
        });
      }

    } catch (error) {
      console.error('Verify vendor payment error:', error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to verify payment", 
        error: error.message 
      });
    }
  },
 

  // Get user's vendor orders
//   getUserOrders: async (req, res) => {
//     try {
//       const orders = await VendorOrder.find({ user: req.user.id })
//         .populate('vendor', 'businessName')
//         .populate('booking', 'property')
//         .sort({ createdAt: -1 });

//       res.status(200).json({ orders });
//     } catch (error) {
//       console.error('Get user vendor orders error:', error);
//       res.status(500).json({ 
//         message: "Failed to fetch orders", 
//         error: error.message 
//       });
//     }
//   },

  // In vendorOrderController.js - Update getUserOrders method
    getUserOrders: async (req, res) => {
    try {
        const orders = await VendorOrder.find({ user: req.user.id })
        .populate('vendor', 'businessName contactPerson')
        .populate('booking', 'property checkIn checkOut')
        .populate('items.product', 'name description images preparationTime price') // ADD THIS LINE
        .sort({ createdAt: -1 });

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Get user vendor orders error:', error);
        res.status(500).json({ 
        message: "Failed to fetch orders", 
        error: error.message 
        });
    }
    },

  // Get vendor orders (Admin only)
//   getAllOrders: async (req, res) => {
//     try {
//       const { 
//         page = 1, 
//         limit = 20, 
//         status, 
//         vendor, 
//         paymentStatus 
//       } = req.query;

//       const query = {};
//       if (status) query.orderStatus = status;
//       if (vendor) query.vendor = vendor;
//       if (paymentStatus) query.paymentStatus = paymentStatus;

//       const orders = await VendorOrder.find(query)
//         .populate('user', 'firstName lastName email')
//         .populate('vendor', 'businessName')
//         .populate('booking', 'property')
//         .sort({ createdAt: -1 })
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await VendorOrder.countDocuments(query);

//       res.status(200).json({
//         orders,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get all vendor orders error:', error);
//       res.status(500).json({ 
//         message: "Failed to fetch orders", 
//         error: error.message 
//       });
//     }
//   },

  // In vendorOrderController.js - Update getAllOrders method
    getAllOrders: async (req, res) => {
    try {
        const { 
        page = 1, 
        limit = 20, 
        status, 
        vendor, 
        paymentStatus 
        } = req.query;

        const query = {};
        if (status) query.orderStatus = status;
        if (vendor) query.vendor = vendor;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const orders = await VendorOrder.find(query)
        .populate('user', 'firstName lastName email')
        .populate('vendor', 'businessName contactPerson')
        .populate('booking', 'property')
        .populate('items.product', 'name description images preparationTime price') // ADD THIS LINE
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await VendorOrder.countDocuments(query);

        res.status(200).json({
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
        });

    } catch (error) {
        console.error('Get all vendor orders error:', error);
        res.status(500).json({ 
        message: "Failed to fetch orders", 
        error: error.message 
        });
    }
    },

  // Update order status (Admin only)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, vendorNotes } = req.body;

      const order = await VendorOrder.findById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.orderStatus = status;
      if (vendorNotes) order.vendorNotes = vendorNotes;

      if (status === 'delivered') {
        order.actualDeliveryTime = new Date();
      }

      await order.save();

      // Send status update email to customer
      if (['out_for_delivery', 'delivered'].includes(status)) {
        await emailService.sendVendorOrderStatusUpdate(order);
      }

      res.status(200).json({
        message: "Order status updated successfully",
        order
      });

    } catch (error) {
      console.error('Update vendor order status error:', error);
      res.status(500).json({ 
        message: "Failed to update order status", 
        error: error.message 
      });
    }
  }
};

module.exports = vendorOrderController;




  