const SavedChat = require("../models/SavedChat");
const Chat = require("../models/Chat");
const Character = require("../models/Character");
const axios = require("axios");

// @desc    Save current chat with AI-generated summary
// @route   POST /api/saved-chats/:characterId
// @access  Private
exports.saveCurrentChat = async (req, res) => {
  try {
    // Get the current active chat
    const chat = await Chat.findOne({
      user: req.user.id,
      character: req.params.characterId,
    });

    if (!chat) {
      return res.status(404).json({ msg: "No active chat found" });
    }

    if (!chat.messages || chat.messages.length === 0) {
      return res.status(400).json({ msg: "Chat has no messages to save" });
    }

    // Generate summary using AI service
    let summary = "Untitled conversation";
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://ai_service:5001";
      const response = await axios.post(
        `${aiServiceUrl}/api/generate-summary`,
        {
          messages: chat.messages,
        }
      );

      if (response.data && response.data.summary) {
        summary = response.data.summary;
      }
    } catch (summaryError) {
      console.error("Failed to generate summary:", summaryError.message);
      // Continue with default summary
    }

    // Create saved chat
    const savedChat = new SavedChat({
      user: req.user.id,
      character: req.params.characterId,
      title: summary,
      messages: chat.messages,
    });

    await savedChat.save();

    // Populate character details
    const populatedSavedChat = await SavedChat.findById(savedChat._id).populate(
      "character",
      ["name", "imageUrl"]
    );

    res.json(populatedSavedChat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all saved chats for a character
// @route   GET /api/saved-chats/character/:characterId
// @access  Private
exports.getSavedChatsByCharacter = async (req, res) => {
  try {
    const savedChats = await SavedChat.find({
      user: req.user.id,
      character: req.params.characterId,
    })
      .populate("character", ["name", "imageUrl"])
      .sort({ savedAt: -1 });

    res.json(savedChats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all saved chats for the logged in user
// @route   GET /api/saved-chats
// @access  Private
exports.getAllSavedChats = async (req, res) => {
  try {
    const savedChats = await SavedChat.find({ user: req.user.id })
      .populate("character", ["name", "imageUrl"])
      .sort({ savedAt: -1 });

    res.json(savedChats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get a specific saved chat
// @route   GET /api/saved-chats/:id
// @access  Private
exports.getSavedChat = async (req, res) => {
  try {
    const savedChat = await SavedChat.findById(req.params.id).populate(
      "character",
      ["name", "imageUrl", "personality", "background", "description"]
    );

    if (!savedChat) {
      return res.status(404).json({ msg: "Saved chat not found" });
    }

    // Check if saved chat belongs to user
    if (savedChat.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Not authorized to view this saved chat" });
    }

    res.json(savedChat);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Saved chat not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a saved chat
// @route   DELETE /api/saved-chats/:id
// @access  Private
exports.deleteSavedChat = async (req, res) => {
  try {
    const savedChat = await SavedChat.findById(req.params.id);

    if (!savedChat) {
      return res.status(404).json({ msg: "Saved chat not found" });
    }

    // Check if saved chat belongs to user
    if (savedChat.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Not authorized to delete this saved chat" });
    }

    await SavedChat.findByIdAndDelete(req.params.id);

    res.json({ msg: "Saved chat deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Saved chat not found" });
    }
    res.status(500).send("Server Error");
  }
};
