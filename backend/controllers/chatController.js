const Chat = require("../models/Chat");
const Character = require("../models/Character");
const axios = require("axios");
const { validationResult } = require("express-validator");

// @desc    Get all chats for the logged in user
// @route   GET /api/chat
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .populate("character", ["name", "imageUrl", "personality"])
      .sort({ lastMessageTimestamp: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get chat with a specific character
// @route   GET /api/chat/:characterId
// @access  Private
exports.getChatWithCharacter = async (req, res) => {
  try {
    // Check if character exists
    const character = await Character.findById(req.params.characterId);
    if (!character) {
      return res.status(404).json({ msg: "Character not found" });
    }

    // Check if chat exists, if not create it
    let chat = await Chat.findOne({
      user: req.user.id,
      character: req.params.characterId,
    }).populate("character", [
      "name",
      "imageUrl",
      "personality",
      "background",
      "description",
    ]);

    if (!chat) {
      // Create new chat
      chat = new Chat({
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
      });

      await chat.save();

      // Populate character details
      chat = await Chat.findById(chat._id).populate("character", [
        "name",
        "imageUrl",
        "personality",
        "background",
        "description",
      ]);
    }

    res.json(chat);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Character not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Send a message to a character
// @route   POST /api/chat/:characterId
// @access  Private
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message } = req.body;

  try {
    // Check if character exists
    const character = await Character.findById(req.params.characterId);
    if (!character) {
      return res.status(404).json({ msg: "Character not found" });
    }

    // Find chat or create new one
    let chat = await Chat.findOne({
      user: req.user.id,
      character: req.params.characterId,
    });

    if (!chat) {
      chat = new Chat({
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
      });
    }

    // Add user message to chat
    chat.messages.push({
      sender: "user",
      content: message,
    });

    // Get character's reply
    const characterReply = await getCharacterReply(character, chat.messages);

    // Add character's reply to chat
    chat.messages.push({
      sender: "character",
      content: characterReply,
    });

    // Update last message timestamp
    chat.lastMessageTimestamp = Date.now();

    await chat.save();

    // Populate character details and return chat
    const updatedChat = await Chat.findById(chat._id).populate("character", [
      "name",
      "imageUrl",
      "personality",
      "background",
      "description",
    ]);

    res.json(updatedChat);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Character not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a chat
// @route   DELETE /api/chat/:chatId
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ msg: "Chat not found" });
    }

    // Check if chat belongs to user
    if (chat.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Not authorized to delete this chat" });
    }

    await chat.remove();

    res.json({ msg: "Chat deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Chat not found" });
    }
    res.status(500).send("Server Error");
  }
};

// Helper function to get character's reply
// This would usually interact with an AI service
const getCharacterReply = async (character, messages) => {
  // For basic implementation, we'll simulate AI response
  // In a production app, this would call the OpenAI API or similar

  try {
    // Call AI service if configured
    if (process.env.AI_SERVICE_URL) {
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL}/api/chat`,
        {
          character: {
            name: character.name,
            personality: character.personality,
            background: character.background,
            interests: character.interests,
            occupation: character.occupation,
          },
          messages: messages,
        },
      );

      return response.data.reply;
    }

    // Fallback responses if AI service is not available
    const fallbackResponses = [
      `Hi there! I'm ${character.name}. How can I help you today?`,
      `That's interesting! Tell me more about it.`,
      `I'm not sure I understand. Can you explain?`,
      `I like talking with you! What else is on your mind?`,
      `That's cool! I'd like to know more about you.`,
      `Hmm, let me think about that for a moment...`,
      `Oh really? That's fascinating!`,
      `I see. That makes sense.`,
      `What a lovely conversation we're having!`,
      `You're so nice to talk to!`,
    ];

    const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
    return fallbackResponses[randomIndex];
  } catch (error) {
    console.error("Error getting character reply:", error);
    return `Sorry, I'm having trouble processing that right now. Can we talk about something else?`;
  }
};
