// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

const authRoutes = require("./Routes/authRoute.js"); 
const userRoutes = require("./Routes/userRoute.js"); 
const propertyRoutes = require("./Routes/propertyRoute");
const amenityRoutes = require("./Routes/amenityRoute");
const bookingRoutes = require("./Routes/bookingRoute"); 
const adminAccessPassRoutes = require("./Routes/adminAccessPassRoutes"); 
const vendorRoutes = require("./Routes/vendorRoutes"); 
const housekeepingRoutes = require("./Routes/housekeepingRoute");
const inventoryRoutes = require("./Routes/inventoryRoute"); 
const maintenanceRoutes = require("./Routes/maintenanceRoute"); 
const staffRoutes = require("./Routes/staffRoute");

const app = express();

/* Enhanced Security & CORS - MOBILE FIXED */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Disable CSP for testing (re-enable later)
  contentSecurityPolicy: false
}));

// FIXED: Mobile-compatible CORS
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl)
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       process.env.CLIENT_URL,
//       "https://shortletfront-vcd6.vercel.app",
//       "https://shortletfront.vercel.app",
//       "http://localhost:3000",
//       "http://localhost:3001",
//       "http://localhost:8080",
//       "http://localhost:8100", // Ionic dev server
//       "capacitor://localhost",
//       "ionic://localhost"
//     ].filter(Boolean);
    
//     // Check if origin matches any allowed origin
//     const originMatches = allowedOrigins.some(allowedOrigin => {
//       // Remove trailing slashes for comparison
//       const cleanOrigin = origin.replace(/\/$/, '');
//       const cleanAllowed = allowedOrigin.replace(/\/$/, '');
//       return cleanOrigin === cleanAllowed;
//     });
    
//     if (originMatches || !origin) {
//       callback(null, true);
//     } else {
//       console.log('CORS blocked for origin:', origin);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type', 
//     'Authorization', 
//     'X-Requested-With',
//     'Accept',
//     'Origin',
//     'Access-Control-Request-Method',
//     'Access-Control-Request-Headers',
//     'X-API-Key'
//   ],
//   exposedHeaders: [
//     'Content-Range', 
//     'X-Content-Range',
//     'Access-Control-Allow-Origin',
//     'Access-Control-Allow-Credentials'
//   ],
//   optionsSuccessStatus: 204,
//   preflightContinue: false,
//   maxAge: 86400 // 24 hours
// }));

// ULTIMATE CORS FIX - Replace your current CORS setup with this
app.use(cors({
  origin: [
    'https://shortletfront-vcd6.vercel.app',
    'https://shortletfront.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Simple OPTIONS handler
app.options('*', cors());


// Handle OPTIONS/preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.status(204).end();
});

// Add mobile-specific headers middleware
app.use((req, res, next) => {
  // Set CORS headers for all responses
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://shortletfront-vcd6.vercel.app",
    "https://shortletfront.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Mobile-specific optimizations
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Cache control for mobile
  if (req.method === 'GET') {
    res.header('Cache-Control', 'public, max-age=300'); // 5 minutes for mobile
  } else {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* Request Logger Middleware */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'} - User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'unknown'}`);
  next();
});

/* Routes */
app.use("/auth", authRoutes); 
app.use("/users", userRoutes);
app.use("/properties", propertyRoutes);
app.use("/amenities", amenityRoutes); 
app.use("/bookings", bookingRoutes); 
app.use("/access", adminAccessPassRoutes); 
app.use("/api", vendorRoutes);
app.use("/housekeeping", housekeepingRoutes); 
app.use("/inventory", inventoryRoutes);
app.use("/maintenance", maintenanceRoutes); 
app.use("/staff", staffRoutes);


// Add this in your server/index.js, after all your other routes but BEFORE the 404 handler

/* Root Route - Welcome Message */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Hols Apartments API",
    version: "1.0.0",
    documentation: "https://github.com/siremms300/shortletback",
    endpoints: {
      auth: "/auth",
      users: "/users",
      properties: "/properties",
      bookings: "/bookings",
      amenities: "/amenities",
      vendors: "/api/vendors",
      housekeeping: "/housekeeping",
      inventory: "/inventory",
      maintenance: "/maintenance",
      staff: "/staff"
    },
    health: "/health",
    test: "/test",
    mobileTest: "/mobile-test",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    deployed: process.env.VERCEL ? "Vercel" : "Local"
  });
});




/* Health Check with DB status */
app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'none',
    mobile: /mobile|android|iphone|ipad|phone/i.test(req.headers['user-agent'] || '') ? 'yes' : 'no'
  });
});

// Add a mobile-specific test endpoint
app.get("/mobile-test", (req, res) => {
  res.json({
    success: true,
    message: "Mobile API is working!",
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent'] || 'unknown',
    isMobile: /mobile|android|iphone|ipad|phone/i.test(req.headers['user-agent'] || ''),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: process.env.VERCEL ? "true" : "false"
  });
});

// Add a test endpoint for Vercel
app.get("/test", (req, res) => {
  res.json({
    message: "API is working!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL ? "true" : "false",
    origin: req.headers.origin || 'none'
  });
});

/* 404 Handler */
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    origin: req.headers.origin || 'none'
  });
});

/* Enhanced Error Handler */
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  console.error(`Origin: ${req.headers.origin || 'none'}`);
  console.error(`URL: ${req.method} ${req.url}`);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: "Validation Error", 
      errors: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: "Invalid token" });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: "Token expired" });
  }
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: "CORS Error", 
      details: err.message,
      yourOrigin: req.headers.origin,
      allowedOrigins: [
        "https://shortletfront-vcd6.vercel.app",
        "https://shortletfront.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001"
      ]
    });
  }
  
  // Default error
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? "Something went wrong!" 
      : err.message,
    origin: req.headers.origin || 'none'
  });
});

/* MongoDB Connection with better error handling */
const PORT = process.env.PORT || 3001;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "HolsApartment",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through app termination');
  process.exit(0);
});

// FIXED: Single startServer function
const startServer = async () => {
  await connectDB();
  
  // Only listen if NOT on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Test endpoint: http://localhost:${PORT}/test`);
    });
  } else {
    console.log("🚀 Running on Vercel - Serverless mode");
  }
};

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

// EXPORT THE APP FOR VERCEL BRIDGE
module.exports = app;

















































// // server/index.js
// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv").config();
// const cors = require("cors");
// const path = require("path");
// const helmet = require("helmet"); // Add this for security

// const authRoutes = require("./Routes/authRoute.js"); 
// const userRoutes = require("./Routes/userRoute.js"); 
// const propertyRoutes = require("./Routes/propertyRoute");
// const amenityRoutes = require("./Routes/amenityRoute");
// const bookingRoutes = require("./Routes/bookingRoute"); 
// const adminAccessPassRoutes = require("./Routes/adminAccessPassRoutes"); 
// const vendorRoutes = require("./Routes/vendorRoutes"); 
// const housekeepingRoutes = require("./Routes/housekeepingRoute");
// const inventoryRoutes = require("./Routes/inventoryRoute"); 
// const maintenanceRoutes = require("./Routes/maintenanceRoute"); 
// const staffRoutes = require("./Routes/staffRoute");
 

// const app = express();

// /* Enhanced Security & CORS */
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// // FIXED: Single CORS middleware with all origins
// app.use(cors({
//   origin: [
//     process.env.CLIENT_URL,
//     "https://shortletfront-vcd6.vercel.app",
//     // "https://shortletfront.vercel.app",
//     "http://localhost:3000",
//     "http://localhost:3001"
//   ].filter(Boolean), // Remove any undefined/null values
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Serve uploaded files
// app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// /* Request Logger Middleware */
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// }); 

// /* Routes */
// app.use("/auth", authRoutes); 
// app.use("/users", userRoutes);
// app.use("/properties", propertyRoutes);
// app.use("/amenities", amenityRoutes); 
// app.use("/bookings", bookingRoutes); 
// app.use("/access", adminAccessPassRoutes); 
// app.use("/api", vendorRoutes);
// app.use("/housekeeping", housekeepingRoutes); 
// app.use("/inventory", inventoryRoutes);
// app.use("/maintenance", maintenanceRoutes); 
// app.use("/staff", staffRoutes);

// /* Health Check with DB status */
// app.get("/health", async (req, res) => {
//   const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
//   res.status(200).json({ 
//     status: "OK", 
//     message: "Server is running",
//     database: dbStatus,
//     timestamp: new Date().toISOString()
//   });
// });

// // Add a test endpoint for Vercel
// app.get("/test", (req, res) => {
//   res.json({
//     message: "API is working!",
//     environment: process.env.NODE_ENV || "development",
//     timestamp: new Date().toISOString(),
//     vercel: process.env.VERCEL ? "true" : "false"
//   });
// });

// /* 404 Handler */
// app.use("*", (req, res) => {
//   res.status(404).json({ 
//     message: "Route not found",
//     path: req.originalUrl
//   });
// });

// /* Enhanced Error Handler */
// app.use((err, req, res, next) => {
//   console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     return res.status(400).json({ 
//       message: "Validation Error", 
//       errors: Object.values(err.errors).map(e => e.message) 
//     });
//   }
  
//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     return res.status(401).json({ message: "Invalid token" });
//   }
  
//   if (err.name === 'TokenExpiredError') {
//     return res.status(401).json({ message: "Token expired" });
//   }
  
//   // Default error
//   res.status(500).json({ 
//     message: process.env.NODE_ENV === 'production' 
//       ? "Something went wrong!" 
//       : err.message 
//   });
// });

// /* MongoDB Connection with better error handling */
// const PORT = process.env.PORT || 3001;

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URL, {
//       dbName: "HolsApartment",
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
//       socketTimeoutMS: 45000, // Close sockets after 45 seconds
//     });
//     console.log("✅ MongoDB connected successfully");
//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err.message);
//     // Don't exit on Vercel - let it retry
//     if (!process.env.VERCEL) {
//       process.exit(1);
//     }
//   }
// };

// // Handle MongoDB connection events
// mongoose.connection.on('disconnected', () => {
//   console.log('⚠️ MongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('❌ MongoDB connection error:', err);
// });

// // Graceful shutdown
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   console.log('🛑 MongoDB connection closed through app termination');
//   process.exit(0);
// });

// // FIXED: Single startServer function
// const startServer = async () => {
//   await connectDB();
  
//   // Only listen if NOT on Vercel
//   if (!process.env.VERCEL) {
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log(`📊 Environment: ${process.env.NODE_ENV}`);
//       console.log(`🌐 Health check: http://localhost:${PORT}/health`);
//       console.log(`🌐 Test endpoint: http://localhost:${PORT}/test`);
//     });
//   } else {
//     console.log("🚀 Running on Vercel - Serverless mode");
//   }
// };

// // Only start server if this file is run directly (not imported)
// if (require.main === module) {
//   startServer().catch(err => {
//     console.error('❌ Failed to start server:', err);
//     process.exit(1);
//   });
// }

// // EXPORT THE APP FOR VERCEL BRIDGE
// module.exports = app;

























































// // index.js
// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv").config();
// const cors = require("cors");
// const path = require("path");
// const helmet = require("helmet"); // Add this for security

// const authRoutes = require("./Routes/authRoute.js"); 
// // const bookingRoutes = require("./Routes/bookingRoute.js");
// const userRoutes = require("./Routes/userRoute.js"); 
// const propertyRoutes = require("./Routes/propertyRoute");
// const amenityRoutes = require("./Routes/amenityRoute");
// const bookingRoutes = require("./Routes/bookingRoute"); 
// const adminAccessPassRoutes = require("./Routes/adminAccessPassRoutes"); 
// const vendorRoutes = require("./Routes/vendorRoutes"); 
// const housekeepingRoutes = require("./Routes/housekeepingRoute");
// const inventoryRoutes = require("./Routes/inventoryRoute"); 
// const maintenanceRoutes = require("./Routes/maintenanceRoute"); 
// const staffRoutes = require("./Routes/staffRoute");
 

// const app = express();

// /* Enhanced Security & CORS */
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true
// }));

// app.use(cors({
//   origin: [
//     process.env.CLIENT_URL,
//     "https://shortletfront-vcd6.vercel.app", // Your Vercel frontend
//     "http://localhost:3000" // For local development
//   ],
//   credentials: true
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Serve uploaded files
// // app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));



// // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ THE ROUTE BELOW WORKED @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// // app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// /* Request Logger Middleware */
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// }); 

// /* Routes */
// app.use("/auth", authRoutes); 
// // app.use("/bookings", bookingRoutes);
// app.use("/users", userRoutes);
// app.use("/properties", propertyRoutes);
// app.use("/amenities", amenityRoutes); 
// app.use("/bookings", bookingRoutes); 
// app.use("/access", adminAccessPassRoutes); 
// app.use("/api", vendorRoutes);
// app.use("/housekeeping", housekeepingRoutes); 
// app.use("/inventory", inventoryRoutes);
// app.use("/maintenance", maintenanceRoutes); 
// app.use("/staff", staffRoutes);
 


// /* Health Check with DB status */
// app.get("/health", async (req, res) => {
//   const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
//   res.status(200).json({ 
//     status: "OK", 
//     message: "Server is running",
//     database: dbStatus,
//     timestamp: new Date().toISOString()
//   });
// });

// /* 404 Handler */
// app.use("*", (req, res) => {
//   res.status(404).json({ 
//     message: "Route not found",
//     path: req.originalUrl
//   });
// });

// /* Enhanced Error Handler */
// app.use((err, req, res, next) => {
//   console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     return res.status(400).json({ 
//       message: "Validation Error", 
//       errors: Object.values(err.errors).map(e => e.message) 
//     });
//   }
  
//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     return res.status(401).json({ message: "Invalid token" });
//   }
  
//   if (err.name === 'TokenExpiredError') {
//     return res.status(401).json({ message: "Token expired" });
//   }
  
//   // Default error
//   res.status(500).json({ 
//     message: process.env.NODE_ENV === 'production' 
//       ? "Something went wrong!" 
//       : err.message 
//   });
// });

// /* MongoDB Connection with better error handling */
// const PORT = process.env.PORT || 3001;

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URL, {
//       dbName: "HolsApartment",
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ MongoDB connected successfully");
//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err);
//     process.exit(1);
//   }
// };

// // Handle MongoDB connection events
// mongoose.connection.on('disconnected', () => {
//   console.log('⚠️ MongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('❌ MongoDB connection error:', err);
// });

// // Graceful shutdown
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   console.log('🛑 MongoDB connection closed through app termination');
//   process.exit(0);
// });

// // Start server
// const startServer = async () => {
//   await connectDB();
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📊 Environment: ${process.env.NODE_ENV}`);
//     console.log(`🌐 Health check: http://localhost:${PORT}/health`);
//   });
// };

// startServer().catch(err => {
//   console.error('❌ Failed to start server:', err);
//   process.exit(1);
// });

 


