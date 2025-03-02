const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;
  
  console.log('Register attempt:', { username, email });

  try {
    console.log('Checking if user exists...');
    // Check if user already exists - add retry logic
    let user;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        user = await User.findOne({ email });
        break; // If successful, exit the loop
      } catch (err) {
        console.log(`Attempt ${i+1}/${maxRetries} failed: ${err.message}`);
        if (i === maxRetries - 1) throw err; // If last attempt, rethrow
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }
    if (user) {
      console.log('User with this email already exists');
      return res.status(400).json({ msg: 'User already exists' });
    }

    console.log('Creating new user...');
    // Create new user
    user = new User({
      username,
      email,
      password
    });

    // Save user to database with retry logic
    console.log('Saving user to database...');
    const saveWithRetry = async (userData, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await userData.save();
          console.log('User saved successfully');
          return true;
        } catch (saveErr) {
          console.error(`Save attempt ${i+1}/${maxRetries} failed:`, saveErr.message);
          
          if (saveErr.code === 11000) {
            // Duplicate key error - don't retry
            return res.status(400).json({ 
              msg: 'Username or email already exists',
              error: saveErr.message
            });
          }
          
          if (i === maxRetries - 1) throw saveErr; // If last attempt, rethrow
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
      }
    };
    
    await saveWithRetry(user);

    // Create JWT token
    console.log('Creating JWT token...');
    console.log('JWT Secret available:', !!process.env.JWT_SECRET);
    
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign error:', err);
          return res.status(500).json({ msg: 'Error generating token', error: err.message });
        }
        
        console.log('Registration successful');
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            isCreator: user.isCreator,
            createdAt: user.createdAt
          }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      id: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('characters');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  const { username, email, bio, profilePicture, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;
    
    // Only update password if provided
    if (password) {
      // Password will be hashed in the pre-save hook
      user.password = password;
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all creators
// @route   GET /api/users/creators
// @access  Public
exports.getCreators = async (req, res) => {
  try {
    const creators = await User.find({ isCreator: true })
      .select('-password')
      .populate('characters');
    
    res.json(creators);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('characters');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};