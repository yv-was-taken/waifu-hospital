const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "character"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const SavedChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  character: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Character",
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "Untitled conversation",
  },
  messages: [MessageSchema],
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SavedChat", SavedChatSchema);
