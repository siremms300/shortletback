// services/accessPassService.js
const emailService = require('./emailService');

const accessPassService = {
  // Send access pass to user (manual entry from admin)
  sendAccessPass: async (booking, accessCode, adminUser, provider = '', instructions = '') => {
    try {
      if (!accessCode || accessCode.trim() === '') {
        throw new Error('Access code is required');
      }

      // Update booking with access pass information
      booking.accessPass = {
        code: accessCode.trim(),
        providedBy: provider.trim(),
        sentAt: new Date(),
        sentBy: adminUser._id,
        expiresAt: new Date(booking.checkOut), // Expires at check-out
        status: 'sent',
        instructions: instructions.trim()
      };

      await booking.save();

      // Send email notification to user using the exported transporter
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
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #fcfeff;
              margin: 0;
            }
            .content {
              padding: 30px;
              background: #fcfeff;
            }
            .access-code {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              border: 2px dashed #f06123;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #f06123;
              letter-spacing: 4px;
              font-family: 'Courier New', monospace;
            }
            .instructions {
              background: #f0f8ff;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .booking-info {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
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
              <h1>Your Access Pass is Ready! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${booking.user.firstName}</strong>,</p>
              <p>Your access pass for <strong>${booking.property.title}</strong> has been provided and is ready for your stay.</p>
              
              <div class="access-code">
                <p style="margin-bottom: 15px; color: #383a3c; font-size: 16px;">Your Access Code:</p>
                <div class="code">${booking.accessPass.code}</div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  Valid until: ${new Date(booking.checkOut).toLocaleDateString()} at ${new Date(booking.checkOut).toLocaleTimeString()}
                </p>
              </div>

              ${instructions ? `
              <div class="instructions">
                <h3 style="color: #f06123; margin-top: 0;">Usage Instructions:</h3>
                <p style="white-space: pre-line;">${instructions}</p>
              </div>
              ` : ''}

              <div class="booking-info">
                <h3 style="color: #383a3c; margin-top: 0;">Booking Details:</h3>
                <p><strong>Property:</strong> ${booking.property.title}</p>
                <p><strong>Address:</strong> ${booking.property.location}</p>
                <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleString()}</p>
                <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleString()}</p>
                <p><strong>Guests:</strong> ${booking.guests}</p>
              </div>

              <p><strong>Important:</strong> Keep this access code secure and do not share it with others.</p>
              
              <p>If you have any issues with the access code, please contact our support team immediately.</p>
              
              <p>Enjoy your stay!<br>The Hols Apartments Team</p>
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
        to: booking.user.email,
        subject: `Access Pass for ${booking.property.title} - Hols Apartments`,
        html: htmlContent,
      };

      // Use the exported transporter from emailService
      await emailService.transporter.sendMail(mailOptions);
      
      console.log(`Access pass sent to ${booking.user.email} for booking ${booking._id}`);
      return true;

    } catch (error) {
      console.error('Error sending access pass:', error);
      throw error;
    }
  }
};

module.exports = accessPassService;























































// // services/accessPassService.js
// const emailService = require('./emailService');

// const accessPassService = {
//   // Send access pass to user (manual entry from admin)
//   sendAccessPass: async (booking, accessCode, adminUser, provider = '', instructions = '') => {
//     try {
//       if (!accessCode || accessCode.trim() === '') {
//         throw new Error('Access code is required');
//       }

//       // Update booking with access pass information
//       booking.accessPass = {
//         code: accessCode.trim(),
//         providedBy: provider.trim(),
//         sentAt: new Date(),
//         sentBy: adminUser._id,
//         expiresAt: new Date(booking.checkOut), // Expires at check-out
//         status: 'sent',
//         instructions: instructions.trim()
//       };

//       await booking.save();

//       // Send email notification to user
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               color: #383a3c;
//               margin: 0;
//               padding: 0;
//             }
//             .container {
//               max-width: 600px;
//               margin: 0 auto;
//               padding: 20px;
//             }
//             .header {
//               background: #f06123;
//               padding: 30px;
//               text-align: center;
//               border-radius: 8px 8px 0 0;
//             }
//             .header h1 {
//               color: #fcfeff;
//               margin: 0;
//             }
//             .content {
//               padding: 30px;
//               background: #fcfeff;
//             }
//             .access-code {
//               background: #f8f9fa;
//               padding: 25px;
//               border-radius: 8px;
//               text-align: center;
//               margin: 20px 0;
//               border: 2px dashed #f06123;
//             }
//             .code {
//               font-size: 36px;
//               font-weight: bold;
//               color: #f06123;
//               letter-spacing: 4px;
//               font-family: 'Courier New', monospace;
//             }
//             .instructions {
//               background: #f0f8ff;
//               padding: 20px;
//               border-radius: 8px;
//               margin: 20px 0;
//             }
//             .booking-info {
//               background: #f9f9f9;
//               padding: 15px;
//               border-radius: 5px;
//               margin: 15px 0;
//             }
//             .footer {
//               text-align: center;
//               padding: 20px;
//               color: #383a3c;
//               font-size: 12px;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>Your Access Pass is Ready! 🎉</h1>
//             </div>
//             <div class="content">
//               <p>Hello <strong>${booking.user.firstName}</strong>,</p>
//               <p>Your access pass for <strong>${booking.property.title}</strong> has been provided and is ready for your stay.</p>
              
//               <div class="access-code">
//                 <p style="margin-bottom: 15px; color: #383a3c; font-size: 16px;">Your Access Code:</p>
//                 <div class="code">${booking.accessPass.code}</div>
//                 <p style="margin-top: 15px; font-size: 14px; color: #666;">
//                   Valid until: ${new Date(booking.checkOut).toLocaleDateString()} at ${new Date(booking.checkOut).toLocaleTimeString()}
//                 </p>
//               </div>

//               ${instructions ? `
//               <div class="instructions">
//                 <h3 style="color: #f06123; margin-top: 0;">Usage Instructions:</h3>
//                 <p style="white-space: pre-line;">${instructions}</p>
//               </div>
//               ` : ''}

//               <div class="booking-info">
//                 <h3 style="color: #383a3c; margin-top: 0;">Booking Details:</h3>
//                 <p><strong>Property:</strong> ${booking.property.title}</p>
//                 <p><strong>Address:</strong> ${booking.property.location}</p>
//                 <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleString()}</p>
//                 <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleString()}</p>
//                 <p><strong>Guests:</strong> ${booking.guests}</p>
//               </div>

//               <p><strong>Important:</strong> Keep this access code secure and do not share it with others.</p>
              
//               <p>If you have any issues with the access code, please contact our support team immediately.</p>
              
//               <p>Enjoy your stay!<br>The Hols Apartments Team</p>
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
//         to: booking.user.email,
//         subject: `Access Pass for ${booking.property.title} - Hols Apartments`,
//         html: htmlContent,
//       };

//       await emailService.transporter.sendMail(mailOptions);
      
//       console.log(`Access pass sent to ${booking.user.email} for booking ${booking._id}`);
//       return true;

//     } catch (error) {
//       console.error('Error sending access pass:', error);
//       throw error;
//     }
//   }
// };

// module.exports = accessPassService;