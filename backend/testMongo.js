const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();
console.log("Environment loaded:", {
  MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
});

// Test multiple MongoDB connection strings
async function testMongo() {
  const uris = [
    "mongodb://mongodb:27017/waifuhospital",
    "mongodb://waifuhospital-mongodb:27017/waifuhospital",
    "mongodb://localhost:27017/waifuhospital",
    "mongodb://127.0.0.1:27017/waifuhospital",
  ];

  console.log(`Testing ${uris.length} different MongoDB connection strings:`);

  for (const uri of uris) {
    try {
      console.log(`\nAttempting to connect to MongoDB at: ${uri}`);

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      console.log("✅ SUCCESS: MongoDB Connected!");
      console.log("Connection state:", mongoose.connection.readyState);

      // Try to list collections as a verification
      try {
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        console.log(
          "Collections:",
          collections.map((c) => c.name).join(", ") || "None",
        );
      } catch (e) {
        console.error("Error listing collections:", e.message);
      }

      // Close connection before trying next URI
      await mongoose.connection.close();
    } catch (err) {
      console.error(`❌ FAILED: ${err.message}`);
      // Make sure connection is closed before trying next URI
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    }
  }
}

// Run the test
testMongo()
  .then(() => console.log("\nTesting complete"))
  .catch((err) => console.error("Unhandled error:", err))
  .finally(() => process.exit());
