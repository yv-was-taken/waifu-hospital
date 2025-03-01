const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('Environment loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
});

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/waifuhospital';
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Connected Successfully!');
  console.log('Connection state:', mongoose.connection.readyState);
  mongoose.connection.close();
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
});