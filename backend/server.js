const dotenv = require("dotenv");
const result = dotenv.config();
if (result.error) {
  console.error("Error loading .env file:", result.error);
}

console.log("Environment variables loaded:", {
  JWT_SECRET: process.env.JWT_SECRET ? "Set (hidden)" : "Not set",
  MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
  PORT: process.env.PORT,
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Import routes
const userRoutes = require("./routes/userRoutes");
const characterRoutes = require("./routes/characterRoutes");
const chatRoutes = require("./routes/chatRoutes");
const merchandiseRoutes = require("./routes/merchandiseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// CORS MUST come first before other middleware
// Simple CORS configuration for Docker networking
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-auth-token",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  }),
);

// Other middleware
app.use(express.json());

// Request logger for debugging
//app.use((req, res, next) => {
//  console.log(`Incoming request: ${req.method} ${req.url}`);
//  console.log("Headers:", JSON.stringify(req.headers, null, 2));
//  next();
//});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Server error", message: err.message });
});

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://waifuhospital-mongodb:27017/waifuhospital";
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);

// Make mongoose connection available globally
let isConnected = false;

// Try both container name and localhost as fallbacks
const connectWithRetry = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 75000, // 75 seconds
    connectTimeoutMS: 30000, // 30 seconds
    // Allow buffering commands until connection is established
    bufferCommands: true,
  };

  // Only use connection strings that we know work from testing
  const uris = [
    MONGODB_URI,
    "mongodb://mongodb:27017/waifuhospital", // Service name within Docker Compose
    "mongodb://waifuhospital-mongodb:27017/waifuhospital", // Container name
  ];

  // Try each URI in sequence
  for (const uri of uris) {
    try {
      console.log(`Attempting to connect to MongoDB with URI: ${uri}`);
      await mongoose.connect(uri, options);
      console.log(`MongoDB Connected Successfully via ${uri}`);
      isConnected = true;
      return true;
    } catch (err) {
      console.error(`MongoDB Connection Error with ${uri}:`, err.message);
    }
  }

  console.error("All MongoDB connection attempts failed. Please check:");
  console.error("1. MongoDB container is running: docker-compose ps");
  console.error("2. Network configuration in docker-compose.yml");
  console.error("3. MongoDB logs: docker-compose logs mongodb");
  return false;
};

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    const connected = await connectWithRetry();

    if (!connected) {
      console.warn(
        "Starting server without MongoDB connection - some features may not work",
      );
    }

    // Routes
    app.use("/api/users", userRoutes);
    app.use("/api/characters", characterRoutes);
    app.use("/api/chat", chatRoutes);
    app.use("/api/merchandise", merchandiseRoutes);
    app.use("/api/payments", paymentRoutes);

    // Serve static assets in production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../frontend/build")));

      app.get("*", (req, res) => {
        res.sendFile(
          path.resolve(__dirname, "../frontend/build", "index.html"),
        );
      });
    }

    // Start server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server running on port ${PORT} and listening on all interfaces`,
      );
    });

    // Add error handling for the server
    server.on("error", (error) => {
      console.error("Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please use a different port.`,
        );
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

// Start the server
startServer();
