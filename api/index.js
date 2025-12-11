// server/api/index.js - Vercel Serverless Entry Point

// Import the main Express app
const app = require("../index.js");

// Export as serverless function
module.exports = app;

console.log("✅ Vercel serverless handler loaded");