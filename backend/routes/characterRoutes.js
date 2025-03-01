const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Import controllers
const characterController = require('../controllers/characterController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/characters
// @desc    Create a new character
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('imageUrl', 'Image URL is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('personality', 'Personality is required').not().isEmpty(),
    ],
  ],
  characterController.createCharacter
);

// @route   GET /api/characters
// @desc    Get all public characters
// @access  Public
router.get('/', characterController.getCharacters);

// @route   GET /api/characters/user
// @desc    Get all characters for logged in user
// @access  Private
router.get('/user', authMiddleware, characterController.getUserCharacters);

// @route   GET /api/characters/popular
// @desc    Get popular characters
// @access  Public
router.get('/popular', characterController.getPopularCharacters);

// @route   GET /api/characters/:id
// @desc    Get character by ID
// @access  Public
router.get('/:id', characterController.getCharacterById);

// @route   PUT /api/characters/:id
// @desc    Update a character
// @access  Private
router.put('/:id', authMiddleware, characterController.updateCharacter);

// @route   DELETE /api/characters/:id
// @desc    Delete a character
// @access  Private
router.delete('/:id', authMiddleware, characterController.deleteCharacter);

// @route   POST /api/characters/:id/like
// @desc    Like a character
// @access  Private
router.post('/:id/like', authMiddleware, characterController.likeCharacter);

// @route   POST /api/characters/:id/unlike
// @desc    Unlike a character
// @access  Private
router.post('/:id/unlike', authMiddleware, characterController.unlikeCharacter);

module.exports = router;