// Create a new file: services/cleanupService.js
const cron = require('node-cron');
const { cleanupExpiredBookings } = require('../Controllers/bookingController');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running expired bookings cleanup...');
  await cleanupExpiredBookings();
});

module.exports = cron;