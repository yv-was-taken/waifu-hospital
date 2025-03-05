const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  style: {
    type: String,
    enum: ['retro', 'gothic', 'neocyber', 'anime', 'realistic', 'fantasy', 'sci-fi', 'chibi'],
    default: 'anime',
  },
  description: {
    type: String,
    required: true,
  },
  personality: {
    type: String,
    required: true,
  },
  background: {
    type: String,
    default: '',
  },
  interests: [{
    type: String,
  }],
  occupation: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    min: 0,
  },
  greedFactor: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  public: {
    type: Boolean,
    default: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Character', CharacterSchema);