// server/api/index.js - Complete bridge file
require = require("esm")(module, {
  // Enable all the features for best compatibility
  cjs: true,           // Enable CommonJS detection
  cache: true,         // Cache modules for performance
  sourceMap: false,    // Disable source maps for production
  await: true          // Support top-level await
});

// Load your original Express app
const app = require("../index.js");

// Export for Vercel
module.exports = app;

// Log when loaded
console.log("✅ Bridge file loaded successfully");