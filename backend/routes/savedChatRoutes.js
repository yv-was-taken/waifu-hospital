const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  saveCurrentChat,
  getSavedChatsByCharacter,
  getAllSavedChats,
  getSavedChat,
  deleteSavedChat,
} = require("../controllers/savedChatController");

// @route   POST /api/saved-chats/:characterId
// @desc    Save current chat with a character
// @access  Private
router.post("/:characterId", authMiddleware, saveCurrentChat);

// @route   GET /api/saved-chats/character/:characterId
// @desc    Get all saved chats for a specific character
// @access  Private
router.get("/character/:characterId", authMiddleware, getSavedChatsByCharacter);

// @route   GET /api/saved-chats
// @desc    Get all saved chats for the logged in user
// @access  Private
router.get("/", authMiddleware, getAllSavedChats);

// @route   GET /api/saved-chats/:id
// @desc    Get a specific saved chat by ID
// @access  Private
router.get("/:id", authMiddleware, getSavedChat);

// @route   DELETE /api/saved-chats/:id
// @desc    Delete a saved chat
// @access  Private
router.delete("/:id", authMiddleware, deleteSavedChat);

module.exports = router;
