const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Import controllers
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  userController.registerUser
);

// @route   POST /api/users/login
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  userController.loginUser
);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, userController.updateUserProfile);

// @route   GET /api/users/creators
// @desc    Get all content creators
// @access  Public
router.get('/creators', userController.getCreators);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', userController.getUserById);

module.exports = router;