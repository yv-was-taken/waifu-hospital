const Character = require('../models/Character');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create a new character
// @route   POST /api/characters
// @access  Private
exports.createCharacter = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    imageUrl,
    style,
    description,
    personality,
    background,
    interests,
    occupation,
    age,
    public
  } = req.body;

  try {
    // Create a new character
    const newCharacter = new Character({
      name,
      creator: req.user.id,
      imageUrl,
      style,
      description,
      personality,
      background,
      interests,
      occupation,
      age,
      public: public !== undefined ? public : true
    });

    // Save character to database
    const character = await newCharacter.save();

    // Add character to user's characters array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { characters: character._id } },
      { new: true }
    );

    res.json(character);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all public characters
// @route   GET /api/characters
// @access  Public
exports.getCharacters = async (req, res) => {
  try {
    const characters = await Character.find({ public: true })
      .populate('creator', ['username', 'profilePicture'])
      .sort({ createdAt: -1 });
    
    res.json(characters);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all characters for logged in user
// @route   GET /api/characters/user
// @access  Private
exports.getUserCharacters = async (req, res) => {
  try {
    // Include creator info to match other character endpoints
    const characters = await Character.find({ creator: req.user.id })
      .populate('creator', ['username', 'profilePicture'])
      .sort({ createdAt: -1 });
    
    res.json(characters);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get popular characters
// @route   GET /api/characters/popular
// @access  Public
exports.getPopularCharacters = async (req, res) => {
  try {
    const characters = await Character.find({ public: true })
      .populate('creator', ['username', 'profilePicture'])
      .sort({ likes: -1 })
      .limit(10);
    
    res.json(characters);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get character by ID
// @route   GET /api/characters/:id
// @access  Public
exports.getCharacterById = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('creator', ['username', 'profilePicture']);
    
    if (!character) {
      return res.status(404).json({ msg: 'Character not found' });
    }

    // Check if character is private and not owned by the requesting user
    if (!character.public && 
        (!req.user || character.creator._id.toString() !== req.user.id)) {
      return res.status(403).json({ msg: 'This character is private' });
    }

    res.json(character);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Character not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update a character
// @route   PUT /api/characters/:id
// @access  Private
exports.updateCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ msg: 'Character not found' });
    }

    // Check if character belongs to user
    if (character.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this character' });
    }

    // Fields to update
    const {
      name,
      imageUrl,
      style,
      description,
      personality,
      background,
      interests,
      occupation,
      age,
      public
    } = req.body;

    // Build character object
    const characterFields = {};
    if (name) characterFields.name = name;
    if (imageUrl) characterFields.imageUrl = imageUrl;
    if (style) characterFields.style = style;
    if (description) characterFields.description = description;
    if (personality) characterFields.personality = personality;
    if (background) characterFields.background = background;
    if (interests) characterFields.interests = interests;
    if (occupation) characterFields.occupation = occupation;
    if (age) characterFields.age = age;
    if (public !== undefined) characterFields.public = public;

    // Update and return the character
    const updatedCharacter = await Character.findByIdAndUpdate(
      req.params.id,
      { $set: characterFields },
      { new: true }
    );

    res.json(updatedCharacter);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Character not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a character
// @route   DELETE /api/characters/:id
// @access  Private
exports.deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ msg: 'Character not found' });
    }

    // Check if character belongs to user
    if (character.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this character' });
    }

    // Remove character from database (modern approach)
    await Character.deleteOne({ _id: req.params.id });

    // Remove character from user's characters array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { characters: req.params.id } }
    );

    res.json({ msg: 'Character deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Character not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Like a character
// @route   POST /api/characters/:id/like
// @access  Private
exports.likeCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ msg: 'Character not found' });
    }

    // Check if character has already been liked by this user
    if (character.likedBy.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Character already liked' });
    }

    // Add user id to likedBy array and increment likes
    character.likedBy.unshift(req.user.id);
    character.likes += 1;

    await character.save();

    res.json(character);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Character not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Unlike a character
// @route   POST /api/characters/:id/unlike
// @access  Private
exports.unlikeCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    
    if (!character) {
      return res.status(404).json({ msg: 'Character not found' });
    }

    // Check if character has been liked by this user
    if (!character.likedBy.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Character has not yet been liked' });
    }

    // Remove user id from likedBy array and decrement likes
    character.likedBy = character.likedBy.filter(
      id => id.toString() !== req.user.id
    );
    character.likes -= 1;

    await character.save();

    res.json(character);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Character not found' });
    }
    res.status(500).send('Server Error');
  }
};
