const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import controllers
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// @route   GET /api/chat
// @desc    Get all chats for the logged in user
// @access  Private
router.get("/", authMiddleware, chatController.getUserChats);

// @route   GET /api/chat/:characterId
// @desc    Get chat with a specific character
// @access  Private
router.get(
  "/:characterId",
  authMiddleware,
  chatController.getChatWithCharacter,
);

// @route   POST /api/chat/:characterId
// @desc    Send a message to a character
// @access  Private
router.post(
  "/:characterId",
  [authMiddleware, [check("message", "Message is required").not().isEmpty()]],
  chatController.sendMessage,
);

// @route   DELETE /api/chat/:chatId
// @desc    Delete a chat
// @access  Private
router.delete("/:chatId", authMiddleware, chatController.deleteChat);

module.exports = router;
