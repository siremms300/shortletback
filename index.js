// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const helmet = require("helmet"); // Add this for security

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

/* Enhanced Security & CORS */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// FIXED: Single CORS middleware with all origins
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "https://shortletfront-vcd6.vercel.app",
    "https://shortletfront.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ].filter(Boolean), // Remove any undefined/null values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* Request Logger Middleware */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

/* Health Check with DB status */
app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint for Vercel
app.get("/test", (req, res) => {
  res.json({
    message: "API is working!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL ? "true" : "false"
  });
});

/* 404 Handler */
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl
  });
});

/* Enhanced Error Handler */
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  
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
  
  // Default error
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? "Something went wrong!" 
      : err.message 
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
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Don't exit on Vercel - let it retry
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

 


