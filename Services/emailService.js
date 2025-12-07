// services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter (moved outside the object to avoid recreation)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use app password for Gmail
  },
});

const emailService = {
  // Export the transporter so other services can use it
  transporter: transporter,

  // Send welcome email
  sendWelcomeEmail: async (user) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #383a3c;
              background-color: #fcfeff;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #f06123, #ff8c42);
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #fcfeff;
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .content {
              padding: 30px;
            }
            .welcome-text {
              font-size: 18px;
              margin-bottom: 20px;
              color: #383a3c;
            }
            .highlight {
              color: #f06123;
              font-weight: bold;
            }
            .cta-button {
              display: inline-block;
              background-color: #f06123;
              color: #fcfeff !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #383a3c;
              font-size: 14px;
              border-top: 1px solid #e0e0e0;
            }
            .features {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .feature-item {
              margin: 10px 0;
              color: #383a3c;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Hols Apartments! 🎉</h1>
            </div>
            <div class="content">
              <p class="welcome-text">
                Hello <span class="highlight">${user.firstName} ${user.lastName}</span>,
              </p>
              <p>We're thrilled to have you join the Hols Apartments community! Your journey to finding the perfect short-term rental starts here.</p>
              
              <div class="features">
                <h3 style="color: #f06123; margin-top: 0;">What you can do now:</h3>
                <div class="feature-item">✓ Browse and book amazing apartments</div>
                <div class="feature-item">✓ Save your favorite properties to wishlist</div>
                <div class="feature-item">✓ Manage your bookings easily</div>
                <div class="feature-item">✓ Get the best deals on short-term stays</div>
              </div>

              <p>Start exploring our properties and find your perfect stay:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/properties" class="cta-button">
                  Explore Properties
                </a>
              </div>

              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy staying!<br>The Hols Apartments Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments. All rights reserved.</p>
              <p style="color: #f06123; font-weight: bold;">Your trusted partner for short-term rentals</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Welcome to Hols Apartments! 🎉',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error to avoid blocking registration
    }
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #383a3c; 
              margin: 0; 
              padding: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: #f06123; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .header h1 { 
              color: #fcfeff; 
              margin: 0; 
            }
            .content { 
              padding: 20px; 
              background: #fcfeff; 
            }
            .reset-button { 
              background: #f06123; 
              color: #fcfeff; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              display: inline-block; 
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #383a3c; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>You requested to reset your password. Click the button below to create a new password:</p>
              <p><a href="${resetUrl}" class="reset-button">Reset Password</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset Your Hols Apartments Password',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error; // Throw error for password reset flow
    }
  },

  // Send email when user uploads document
  sendDocumentUploadNotification: async (user, documentType) => {
    try {
      const adminEmail = 'techidoga@gmail.com'; // Fixed email address
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #383a3c;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #f06123;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #fcfeff;
              margin: 0;
            }
            .content {
              padding: 20px;
              background: #fcfeff;
            }
            .info-box {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #f06123;
            }
            .action-button {
              background: #f06123;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #383a3c;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Document Uploaded for Verification</h1>
            </div>
            <div class="content">
              <p>A user has uploaded a document for verification:</p>
              <div class="info-box">
                <p><strong>User:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Document Type:</strong> ${documentType}</p>
                <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Please review the document in the admin panel.</p>
              <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/users/${user._id}" class="action-button">
                Review Document
              </a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: 'New Document Uploaded for Verification',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log('Document upload notification sent to admin');
    } catch (error) {
      console.error('Error sending document upload notification:', error);
    }
  },

  // Send email when document is approved
  sendDocumentApprovedNotification: async (user, documentType) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #383a3c;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #4CAF50;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #fcfeff;
              margin: 0;
            }
            .content {
              padding: 20px;
              background: #fcfeff;
            }
            .success-box {
              background: #f0fff0;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #4CAF50;
            }
            .action-button {
              background: #f06123;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #383a3c;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Approved! 🎉</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName},</p>
              <p>We're pleased to inform you that your <strong>${documentType}</strong> document has been verified and approved.</p>
              <div class="success-box">
                <p><strong>Status:</strong> Approved ✅</p>
                <p><strong>Document Type:</strong> ${documentType}</p>
                <p><strong>Approval Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Your account verification is now complete. You can now access all features of our platform.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="action-button">
                Go to Dashboard
              </a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Document Has Been Approved',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log('Document approval notification sent to user');
    } catch (error) {
      console.error('Error sending document approval notification:', error);
    }
  },

  // Send email when document is rejected
  sendDocumentRejectedNotification: async (user, documentType, rejectionReason) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #383a3c;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #ff6b6b;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #fcfeff;
              margin: 0;
            }
            .content {
              padding: 20px;
              background: #fcfeff;
            }
            .rejection-box {
              background: #fff0f0;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #ff6b6b;
            }
            .action-button {
              background: #f06123;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #383a3c;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Verification Update</h1>
            </div>
            <div class="content">
              <p>Dear ${user.firstName},</p>
              <p>We've reviewed your <strong>${documentType}</strong> document and need some additional information.</p>
              <div class="rejection-box">
                <p><strong>Status:</strong> Rejected ❌</p>
                <p><strong>Document Type:</strong> ${documentType}</p>
                <p><strong>Reason:</strong> ${rejectionReason}</p>
              </div>
              <p>Please upload a new document with the required corrections.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/profile" class="action-button">
                Upload New Document
              </a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Document Verification Update',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log('Document rejection notification sent to user');
    } catch (error) {
      console.error('Error sending document rejection notification:', error);
    }
  },

  // Test email configuration
  testEmailConfig: async () => {
    try {
      await transporter.verify();
      console.log('Email configuration is correct');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  },

  // Send booking confirmation email
  sendBookingConfirmation: async (booking) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: #fcfeff; margin: 0; }
            .content { padding: 30px; background: #fcfeff; }
            .booking-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #383a3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello ${booking.user.firstName},</p>
              <p>Your booking has been confirmed. Here are your booking details:</p>
              
              <div class="booking-details">
                <h3>${booking.property.title}</h3>
                <div class="detail-row">
                  <span>Check-in:</span>
                  <span>${new Date(booking.checkIn).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Check-out:</span>
                  <span>${new Date(booking.checkOut).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Guests:</span>
                  <span>${booking.guests}</span>
                </div>
                <div class="detail-row">
                  <span>Total Amount:</span>
                  <span>₦${booking.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <p>We hope you have a wonderful stay!</p>
              <p>The Hols Apartments Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: booking.user.email,
        subject: 'Booking Confirmed - Hols Apartments',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Booking confirmation sent to ${booking.user.email}`);
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  },

  // VENDOR EMAIL 
    sendVendorWelcomeEmail: async (vendor) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: #fcfeff; margin: 0; }
            .content { padding: 30px; background: #fcfeff; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #383a3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Hols Apartments Vendor Network! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${vendor.contactPerson.name}</strong>,</p>
              <p>We're excited to welcome <strong>${vendor.businessName}</strong> to the Hols Apartments vendor network!</p>
              
              <div class="info-box">
                <h3>Your Vendor Details:</h3>
                <p><strong>Business:</strong> ${vendor.businessName}</p>
                <p><strong>Contact:</strong> ${vendor.contactPerson.email} | ${vendor.contactPerson.phone}</p>
                <p><strong>Commission Rate:</strong> ${vendor.commissionRate}%</p>
                <p><strong>Payment Terms:</strong> ${vendor.paymentTerms}</p>
              </div>

              <p>Our team will be in touch shortly to discuss next steps and set up your product catalog.</p>
              <p>Welcome aboard!<br>The Hols Apartments Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: vendor.contactPerson.email,
        subject: 'Welcome to Hols Apartments Vendor Network!',
        html: htmlContent,
      };

      await emailService.transporter.sendMail(mailOptions);
      console.log(`Vendor welcome email sent to ${vendor.contactPerson.email}`);
    } catch (error) {
      console.error('Error sending vendor welcome email:', error);
    }
  },

  // Send vendor order confirmation to customer
  // sendVendorOrderConfirmation: async (order) => {
  //   try {
  //     const htmlContent = `
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <style>
  //           body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
  //           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  //           .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  //           .header h1 { color: #fcfeff; margin: 0; }
  //           .content { padding: 30px; background: #fcfeff; }
  //           .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
  //           .footer { text-align: center; padding: 20px; color: #383a3c; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="container">
  //           <div class="header">
  //             <h1>Vendor Order Confirmed! 🎉</h1>
  //           </div>
  //           <div class="content">
  //             <p>Hello <strong>${order.user.firstName}</strong>,</p>
  //             <p>Your order from <strong>${order.vendor.businessName}</strong> has been confirmed.</p>
              
  //             <div class="order-details">
  //               <h3>Order Details:</h3>
  //               <p><strong>Order Number:</strong> ${order.orderNumber}</p>
  //               <p><strong>Vendor:</strong> ${order.vendor.businessName}</p>
  //               <p><strong>Delivery Address:</strong> ${order.deliveryAddress.property}</p>
  //               <p><strong>Total Amount:</strong> ₦${order.totalAmount.toLocaleString()}</p>
  //             </div>

  //             <p>You will receive another notification when your order is out for delivery.</p>
  //             <p>Thank you for choosing Hols Apartments!<br>The Hols Apartments Team</p>
  //           </div>
  //           <div class="footer">
  //             <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
  //           </div>
  //         </div>
  //       </body>
  //       </html>
  //     `;

  //     const mailOptions = {
  //       from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
  //       to: order.user.email,
  //       subject: `Vendor Order Confirmed - ${order.orderNumber}`,
  //       html: htmlContent,
  //     };

  //     await emailService.transporter.sendMail(mailOptions);
  //     console.log(`Vendor order confirmation sent to ${order.user.email}`);
  //   } catch (error) {
  //     console.error('Error sending vendor order confirmation:', error);
  //   }
  // },


  // In your emailService.js - Enhanced vendor order emails

// Send vendor order confirmation to customer - ENHANCED
sendVendorOrderConfirmation: async (order) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fcfeff; margin: 0; }
          .content { padding: 30px; background: #fcfeff; }
          .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .total { font-weight: bold; font-size: 18px; color: #f06123; }
          .footer { text-align: center; padding: 20px; color: #383a3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vendor Order Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${order.user.firstName}</strong>,</p>
            <p>Your vendor order has been confirmed and is being processed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Vendor:</strong> ${order.vendor.businessName}</p>
              <p><strong>Delivery Address:</strong> ${order.deliveryAddress.property}, ${order.deliveryAddress.unit}</p>
              
              <h4>Order Items:</h4>
              ${order.items.map(item => `
                <div class="item">
                  <span>${item.quantity} × ${item.product.name}</span>
                  <span>₦${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              `).join('')}
              
              <div class="item">
                <span>Subtotal:</span>
                <span>₦${order.subtotal.toLocaleString()}</span>
              </div>
              <div class="item">
                <span>Service Fee:</span>
                <span>₦${order.serviceFee.toLocaleString()}</span>
              </div>
              <div class="item">
                <span>Delivery Fee:</span>
                <span>₦${order.deliveryFee.toLocaleString()}</span>
              </div>
              <div class="item total">
                <span>Total:</span>
                <span>₦${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <p>You can track your order status in your dashboard.</p>
            <p>Thank you for choosing Hols Apartments!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hols Apartments. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: `Vendor Order Confirmed - ${order.orderNumber}`,
      html: htmlContent,
    };

    await emailService.transporter.sendMail(mailOptions);
    console.log(`Vendor order confirmation sent to ${order.user.email}`);
  } catch (error) {
    console.error('Error sending vendor order confirmation:', error);
  }
},

// Enhanced vendor order notification
// sendVendorOrderNotification: async (order) => {
//   try {
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
//           .header h1 { color: #fcfeff; margin: 0; }
//           .content { padding: 30px; background: #fcfeff; }
//           .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
//           .item { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
//           .footer { text-align: center; padding: 20px; color: #383a3c; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>New Order Received! 📦</h1>
//           </div>
//           <div class="content">
//             <p>Hello <strong>${order.vendor.contactPerson.name}</strong>,</p>
//             <p>You have received a new order from Hols Apartments.</p>
            
//             <div class="order-details">
//               <h3>Order Details</h3>
//               <p><strong>Order Number:</strong> ${order.orderNumber}</p>
//               <p><strong>Customer:</strong> ${order.user.firstName} ${order.user.lastName}</p>
//               <p><strong>Customer Email:</strong> ${order.user.email}</p>
//               <p><strong>Customer Phone:</strong> ${order.user.phone || 'Not provided'}</p>
//               <p><strong>Delivery Address:</strong> ${order.deliveryAddress.property}, ${order.deliveryAddress.unit}</p>
//               ${order.deliveryAddress.specialInstructions ? `<p><strong>Delivery Instructions:</strong> ${order.deliveryAddress.specialInstructions}</p>` : ''}
              
//               <h4>Order Items:</h4>
//               ${order.items.map(item => `
//                 <div class="item">
//                   <div>
//                     <strong>${item.quantity} × ${item.product.name}</strong>
//                     ${item.specialInstructions ? `<br><small>Instructions: ${item.specialInstructions}</small>` : ''}
//                   </div>
//                   <span>₦${(item.price * item.quantity).toLocaleString()}</span>
//                 </div>
//               `).join('')}
              
//               <div class="item">
//                 <span><strong>Subtotal:</strong></span>
//                 <span>₦${order.subtotal.toLocaleString()}</span>
//               </div>
//               <div class="item">
//                 <span><strong>Your Commission (${order.vendor.commissionRate}%):</strong></span>
//                 <span>₦${(order.subtotal * (order.vendor.commissionRate / 100)).toLocaleString()}</span>
//               </div>
//               <div class="item" style="font-weight: bold; color: #f06123;">
//                 <span><strong>Total Order Value:</strong></span>
//                 <span>₦${order.totalAmount.toLocaleString()}</span>
//               </div>
//             </div>

//             <p>Please prepare the order for delivery. The customer has been notified.</p>
//             <p><strong>Important:</strong> Please update the order status in the vendor portal as you progress.</p>
//           </div>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Hols Apartments. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     const mailOptions = {
//       from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
//       to: order.vendor.contactPerson.email,
//       subject: `New Order - ${order.orderNumber}`,
//       html: htmlContent,
//     };

//     await emailService.transporter.sendMail(mailOptions);
//     console.log(`Vendor order notification sent to ${order.vendor.contactPerson.email}`);
//   } catch (error) {
//     console.error('Error sending vendor order notification:', error);
//   }
// }
  

  // Send vendor order notification
  sendVendorOrderNotification: async (order) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: #fcfeff; margin: 0; }
            .content { padding: 30px; background: #fcfeff; }
            .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #383a3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Received! 📦</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${order.vendor.contactPerson.name}</strong>,</p>
              <p>You have received a new order from Hols Apartments.</p>
              
              <div class="order-details">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${order.user.firstName} ${order.user.lastName}</p>
                <p><strong>Delivery Address:</strong> ${order.deliveryAddress.property}</p>
                <p><strong>Total Amount:</strong> ₦${order.totalAmount.toLocaleString()}</p>
                <p><strong>Your Commission:</strong> ₦${(order.subtotal * (order.vendor.commissionRate / 100)).toLocaleString()}</p>
              </div>

              <p>Please prepare the order for delivery. The customer has been notified.</p>
              <p>Thank you for partnering with Hols Apartments!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
        to: order.vendor.contactPerson.email,
        subject: `New Order - ${order.orderNumber}`,
        html: htmlContent,
      };

      await emailService.transporter.sendMail(mailOptions);
      console.log(`Vendor order notification sent to ${order.vendor.contactPerson.email}`);
    } catch (error) {
      console.error('Error sending vendor order notification:', error);
    }
  },

  // Send order status update
sendVendorOrderStatusUpdate: async (order) => {
  try {
    const statusMessages = {
      'out_for_delivery': 'is out for delivery',
      'delivered': 'has been delivered'
    };

    const message = statusMessages[order.orderStatus] || 'status has been updated';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fcfeff; margin: 0; }
          .content { padding: 30px; background: #fcfeff; }
          .status-box { background: #f0fff0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; padding: 20px; color: #383a3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update 📦</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${order.user.firstName}</strong>,</p>
            <p>Your order from <strong>${order.vendor.businessName}</strong> ${message}.</p>
            
            <div class="status-box">
              <h3>Order Status: ${order.orderStatus.toUpperCase()}</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              ${order.actualDeliveryTime ? `<p><strong>Delivered At:</strong> ${new Date(order.actualDeliveryTime).toLocaleString()}</p>` : ''}
            </div>

            <p>Thank you for choosing Hols Apartments!<br>The Hols Apartments Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: order.user.email,
      subject: `Order Update - ${order.orderNumber}`,
      html: htmlContent,
    };

    await emailService.transporter.sendMail(mailOptions);
    console.log(`Vendor order status update sent to ${order.user.email}`);
  } catch (error) {
    console.error('Error sending vendor order status update:', error);
  }
},

// In bookingController.js - Update createBooking function
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

    // ... existing validation ...

    // Create booking with payment method
    const booking = new Booking({
      property: propertyId,
      user: req.user.id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalAmount,
      serviceFee,
      specialRequests,
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
        transferReference: `TRF-${Date.now()}`,
        status: 'pending'
      };
    }

    // For onsite payment, initialize onsite details
    if (paymentMethod === 'onsite') {
      booking.onsitePaymentDetails = {
        expectedAmount: totalAmount,
        status: 'pending'
      };
    }

    await booking.save();

    // Send email notification to admin about new booking
    try {
      await emailService.sendNewBookingNotification(booking);
    } catch (emailError) {
      console.error('Failed to send booking notification:', emailError);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: await booking.populate(['property', 'user'])
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      message: "Failed to create booking", 
      error: error.message 
    });
  }
},

// Add new route for bank transfer proof upload
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

    // Check if booking is for bank transfer
    if (booking.paymentMethod !== 'bank_transfer') {
      return res.status(400).json({ 
        success: false,
        message: "This booking is not for bank transfer" 
      });
    }

    // Update bank transfer details with proof
    booking.bankTransferDetails.proofOfPayment = `/uploads/payments/${proofFile.filename}`;
    booking.bankTransferDetails.status = 'pending';
    booking.paymentStatus = 'pending'; // Reset to pending for verification
    
    await booking.save();

    // Notify admin about uploaded proof
    try {
      await emailService.sendPaymentProofNotification(booking);
    } catch (emailError) {
      console.error('Failed to send proof notification:', emailError);
    }

    res.status(200).json({
      success: true,
      message: "Proof of payment uploaded successfully. Admin will verify your payment.",
      booking
    });

  } catch (error) {
    console.error('Upload proof error:', error);
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

    // Update onsite payment details
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    booking.onsitePaymentDetails.status = 'collected';
    booking.onsitePaymentDetails.collectedBy = req.user.id;
    booking.onsitePaymentDetails.collectedAt = new Date(collectedAt) || new Date();
    booking.onsitePaymentDetails.receiptNumber = receiptNumber;

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


// Send new booking notification to admin
// sendNewBookingNotification: async (booking) => {
//   try {
//     const adminEmail = 'techidoga@gmail.com'; // Or get from config
    
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           /* ... existing styles ... */
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>New Booking Created</h1>
//           </div>
//           <div class="content">
//             <p>A new booking has been created and requires your attention.</p>
            
//             <div class="info-box">
//               <h3>Booking Details:</h3>
//               <p><strong>Booking ID:</strong> ${booking._id}</p>
//               <p><strong>Customer:</strong> ${booking.user.firstName} ${booking.user.lastName}</p>
//               <p><strong>Property:</strong> ${booking.property.title}</p>
//               <p><strong>Payment Method:</strong> ${booking.paymentMethod.toUpperCase()}</p>
//               <p><strong>Total Amount:</strong> ₦${booking.totalAmount.toLocaleString()}</p>
//               <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
//               <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
//             </div>

//             <p>Please verify the payment in the admin panel:</p>
//             <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/bookings/${booking._id}" class="action-button">
//               View Booking
//             </a>
//           </div>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     const mailOptions = {
//       from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
//       to: adminEmail,
//       subject: `New Booking - ${booking._id.slice(-8)}`,
//       html: htmlContent,
//     };

//     await emailService.transporter.sendMail(mailOptions);
//     console.log('New booking notification sent to admin');
//   } catch (error) {
//     console.error('Error sending new booking notification:', error);
//   }
// },


// In emailService.js - Update sendNewBookingNotification function
sendNewBookingNotification: async (booking) => {
  try {
    const adminEmail = 'techidoga@gmail.com'; // Or get from config
    
    // Safely get booking ID - handle both string and ObjectId
    const bookingId = booking._id ? (typeof booking._id === 'string' ? booking._id : booking._id.toString()) : 'N/A';
    const shortId = bookingId.length > 8 ? bookingId.slice(-8) : bookingId;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fcfeff; margin: 0; }
          .content { padding: 30px; background: #fcfeff; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #383a3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Created</h1>
          </div>
          <div class="content">
            <p>A new booking has been created and requires your attention.</p>
            
            <div class="info-box">
              <h3>Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${shortId}</p>
              <p><strong>Customer:</strong> ${booking.user?.firstName || 'User'} ${booking.user?.lastName || ''}</p>
              <p><strong>Property:</strong> ${booking.property?.title || 'Property'}</p>
              <p><strong>Payment Method:</strong> ${booking.paymentMethod?.toUpperCase() || 'UNKNOWN'}</p>
              <p><strong>Total Amount:</strong> ₦${booking.totalAmount?.toLocaleString() || '0'}</p>
              <p><strong>Check-in:</strong> ${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Check-out:</strong> ${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'N/A'}</p>
            </div>

            <p>Please verify the payment in the admin panel:</p>
            <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/bookings/${bookingId}" class="action-button">
              View Booking
            </a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Booking - ${shortId}`,
      html: htmlContent,
    };

    await emailService.transporter.sendMail(mailOptions);
    console.log('New booking notification sent to admin');
  } catch (error) {
    console.error('Error sending new booking notification:', error);
  }
},


// Send payment proof uploaded notification
sendPaymentProofNotification: async (booking) => {
  try {
    const adminEmail = 'techidoga@gmail.com';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fcfeff; margin: 0; }
          .content { padding: 30px; background: #fcfeff; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #383a3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Proof Uploaded</h1>
          </div>
          <div class="content">
            <p>A customer has uploaded proof of payment for a bank transfer.</p>
            
            <div class="info-box">
              <h3>Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${booking._id}</p>
              <p><strong>Customer:</strong> ${booking.user.firstName} ${booking.user.lastName}</p>
              <p><strong>Amount:</strong> ₦${booking.totalAmount.toLocaleString()}</p>
              ${booking.bankTransferDetails?.proofOfPayment ? 
                `<p><strong>Proof:</strong> <a href="${process.env.API_URL}${booking.bankTransferDetails.proofOfPayment}">View Proof</a></p>` : ''}
            </div>

            <p>Please verify the payment:</p>
            <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/bookings/${booking._id}" class="action-button">
              Verify Payment
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Payment Proof Uploaded - ${booking._id.slice(-8)}`,
      html: htmlContent,
    };

    await emailService.transporter.sendMail(mailOptions);
    console.log('Payment proof notification sent to admin');
  } catch (error) {
    console.error('Error sending payment proof notification:', error);
  }
},

// Send payment rejected notification to user
sendPaymentRejectedNotification: async (booking) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f06123; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fcfeff; margin: 0; }
          .content { padding: 30px; background: #fcfeff; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #383a3c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #ff6b6b;">
            <h1>Payment Verification Failed</h1>
          </div>
          <div class="content">
            <p>Dear ${booking.user.firstName},</p>
            <p>Your bank transfer payment for booking #${booking._id.slice(-8)} could not be verified.</p>
            
            <div class="info-box">
              <h3>Booking Details:</h3>
              <p><strong>Property:</strong> ${booking.property.title}</p>
              <p><strong>Amount:</strong> ₦${booking.totalAmount.toLocaleString()}</p>
              <p><strong>Status:</strong> <span style="color: #ff6b6b;">Rejected</span></p>
            </div>

            <p>Please contact support for assistance or try a different payment method.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/bookings" class="action-button">
              View Booking
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
      to: booking.user.email,
      subject: `Payment Verification Failed - ${booking._id.slice(-8)}`,
      html: htmlContent,
    };

    await emailService.transporter.sendMail(mailOptions);
    console.log('Payment rejected notification sent to user');
  } catch (error) {
    console.error('Error sending payment rejected notification:', error);
  }
}



};

module.exports = emailService;






















 


























 























































// // services/emailService.js
// const nodemailer = require('nodemailer');

// const emailService = {
//   // Create transporter
//   transporter: nodemailer.createTransport({
//     service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS, // Use app password for Gmail
//     },
//   }),

//   // Send welcome email
//   sendWelcomeEmail: async (user) => {
//     try {
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               color: #383a3c;
//               background-color: #fcfeff;
//               margin: 0;
//               padding: 0;
//             }
//             .container {
//               max-width: 600px;
//               margin: 0 auto;
//               padding: 20px;
//               background-color: #ffffff;
//               border-radius: 8px;
//               box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//             }
//             .header {
//               background: linear-gradient(135deg, #f06123, #ff8c42);
//               padding: 30px;
//               text-align: center;
//               border-radius: 8px 8px 0 0;
//             }
//             .header h1 {
//               color: #fcfeff;
//               margin: 0;
//               font-size: 28px;
//               font-weight: bold;
//             }
//             .content {
//               padding: 30px;
//             }
//             .welcome-text {
//               font-size: 18px;
//               margin-bottom: 20px;
//               color: #383a3c;
//             }
//             .highlight {
//               color: #f06123;
//               font-weight: bold;
//             }
//             .cta-button {
//               display: inline-block;
//               background-color: #f06123;
//               color: #fcfeff !important;
//               padding: 12px 30px;
//               text-decoration: none;
//               border-radius: 5px;
//               font-weight: bold;
//               margin: 20px 0;
//             }
//             .footer {
//               text-align: center;
//               padding: 20px;
//               color: #383a3c;
//               font-size: 14px;
//               border-top: 1px solid #e0e0e0;
//             }
//             .features {
//               background-color: #f8f9fa;
//               padding: 20px;
//               border-radius: 5px;
//               margin: 20px 0;
//             }
//             .feature-item {
//               margin: 10px 0;
//               color: #383a3c;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>Welcome to Hols Apartments! 🎉</h1>
//             </div>
//             <div class="content">
//               <p class="welcome-text">
//                 Hello <span class="highlight">${user.firstName} ${user.lastName}</span>,
//               </p>
//               <p>We're thrilled to have you join the Hols Apartments community! Your journey to finding the perfect short-term rental starts here.</p>
              
//               <div class="features">
//                 <h3 style="color: #f06123; margin-top: 0;">What you can do now:</h3>
//                 <div class="feature-item">✓ Browse and book amazing apartments</div>
//                 <div class="feature-item">✓ Save your favorite properties to wishlist</div>
//                 <div class="feature-item">✓ Manage your bookings easily</div>
//                 <div class="feature-item">✓ Get the best deals on short-term stays</div>
//               </div>

//               <p>Start exploring our properties and find your perfect stay:</p>
              
//               <div style="text-align: center;">
//                 <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/properties" class="cta-button">
//                   Explore Properties
//                 </a>
//               </div>

//               <p>If you have any questions, feel free to reach out to our support team.</p>
              
//               <p>Happy staying!<br>The Hols Apartments Team</p>
//             </div>
//             <div class="footer">
//               <p>&copy; ${new Date().getFullYear()} Hols Apartments. All rights reserved.</p>
//               <p style="color: #f06123; font-weight: bold;">Your trusted partner for short-term rentals</p>
//             </div>
//           </div>
//         </body>
//         </html>
//       `;

//       const mailOptions = {
//         from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
//         to: user.email,
//         subject: 'Welcome to Hols Apartments! 🎉',
//         html: htmlContent,
//       };

//       await emailService.transporter.sendMail(mailOptions);
//       console.log(`Welcome email sent to ${user.email}`);
//     } catch (error) {
//       console.error('Error sending welcome email:', error);
//       // Don't throw error to avoid blocking registration
//     }
//   },

//   // Send password reset email
//   sendPasswordResetEmail: async (user, resetToken) => {
//     try {
//       const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; line-height: 1.6; color: #383a3c; margin: 0; padding: 0; }
//             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//             .header { background: #f06123; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
//             .header h1 { color: #fcfeff; margin: 0; }
//             .content { padding: 20px; background: #fcfeff; }
//             .reset-button { background: #f06123; color: #fcfeff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
//             .footer { text-align: center; padding: 20px; color: #383a3c; font-size: 12px; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>Password Reset Request</h1>
//             </div>
//             <div class="content">
//               <p>Hello ${user.firstName},</p>
//               <p>You requested to reset your password. Click the button below to create a new password:</p>
//               <p><a href="${resetUrl}" class="reset-button">Reset Password</a></p>
//               <p>This link will expire in 1 hour.</p>
//               <p>If you didn't request this, please ignore this email.</p>
//             </div>
//             <div class="footer">
//               <p>&copy; ${new Date().getFullYear()} Hols Apartments</p>
//             </div>
//           </div>
//         </body>
//         </html>
//       `;

//       const mailOptions = {
//         from: `"Hols Apartments" <${process.env.EMAIL_USER}>`,
//         to: user.email,
//         subject: 'Reset Your Hols Apartments Password',
//         html: htmlContent,
//       };

//       await emailService.transport.sendMail(mailOptions);
//       console.log(`Password reset email sent to ${user.email}`);
//     } catch (error) {
//       console.error('Error sending password reset email:', error);
//       throw error; // Throw error for password reset flow
//     }
//   },

//   // Send email when user uploads document
//   sendDocumentUploadNotification: async (user, documentType) => {
//     try {
//       const adminEmail = 'siremms300@gmail.com';
      
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: adminEmail,
//         subject: 'New Document Uploaded for Verification',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #f06123;">New Document Uploaded</h2>
//             <p>A user has uploaded a document for verification:</p>
//             <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
//               <p><strong>User:</strong> ${user.firstName} ${user.lastName}</p>
//               <p><strong>Email:</strong> ${user.email}</p>
//               <p><strong>Document Type:</strong> ${documentType}</p>
//               <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
//             </div>
//             <p>Please review the document in the admin panel.</p>
//             <a href="${process.env.ADMIN_URL}/admin/users/${user._id}" 
//                style="background: #f06123; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Review Document
//             </a>
//           </div>
//         `,
//       };

//       await emailService.transporter.sendMail(mailOptions);
//       console.log('Document upload notification sent to admin');
//     } catch (error) {
//       console.error('Error sending document upload notification:', error);
//     }
//   },

//   // Send email when document is approved
//   sendDocumentApprovedNotification: async (user, documentType) => {
//     try {
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: user.email,
//         subject: 'Your Document Has Been Approved',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #f06123;">Document Approved! 🎉</h2>
//             <p>Dear ${user.firstName},</p>
//             <p>We're pleased to inform you that your <strong>${documentType}</strong> document has been verified and approved.</p>
//             <div style="background: #f0fff0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4CAF50;">
//               <p><strong>Status:</strong> Approved ✅</p>
//               <p><strong>Document Type:</strong> ${documentType}</p>
//               <p><strong>Approval Date:</strong> ${new Date().toLocaleString()}</p>
//             </div>
//             <p>Your account verification is now complete. You can now access all features of our platform.</p>
//             <a href="${process.env.CLIENT_URL}/dashboard" 
//                style="background: #f06123; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Go to Dashboard
//             </a>
//           </div>
//         `,
//       };

//       await emailService.transporter.sendMail(mailOptions);
//       console.log('Document approval notification sent to user');
//     } catch (error) {
//       console.error('Error sending document approval notification:', error);
//     }
//   },

//   // Send email when document is rejected
//   sendDocumentRejectedNotification: async (user, documentType, rejectionReason) => {
//     try {
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: user.email,
//         subject: 'Document Verification Update',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #ff6b6b;">Document Requires Attention</h2>
//             <p>Dear ${user.firstName},</p>
//             <p>We've reviewed your <strong>${documentType}</strong> document and need some additional information.</p>
//             <div style="background: #fff0f0; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff6b6b;">
//               <p><strong>Status:</strong> Rejected ❌</p>
//               <p><strong>Document Type:</strong> ${documentType}</p>
//               <p><strong>Reason:</strong> ${rejectionReason}</p>
//             </div>
//             <p>Please upload a new document with the required corrections.</p>
//             <a href="${process.env.CLIENT_URL}/dashboard/profile" 
//                style="background: #f06123; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Upload New Document
//             </a>
//           </div>
//         `,
//       };

//       await emailService.transporter.sendMail(mailOptions);
//       console.log('Document rejection notification sent to user');
//     } catch (error) {
//       console.error('Error sending document rejection notification:', error);
//     }
//   },
 
// };

// module.exports = emailService;





 