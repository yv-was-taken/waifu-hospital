const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

console.log('Environment variables loaded:', {
  JWT_SECRET: process.env.JWT_SECRET ? 'Set (hidden)' : 'Not set',
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  PORT: process.env.PORT
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const characterRoutes = require('./routes/characterRoutes');
const chatRoutes = require('./routes/chatRoutes');
const merchandiseRoutes = require('./routes/merchandiseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/waifuhospital';
console.log(`Attempting to connect to MongoDB at: ${MONGODB_URI}`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  // Continue server startup even if MongoDB fails
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/payments', paymentRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});