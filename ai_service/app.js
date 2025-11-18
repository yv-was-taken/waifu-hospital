require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const ChatService = require("./services/ChatService");
const ImageService = require("./services/ImageService");
const { setCharacters } = require("./models/Character");

// Initialize Express app
const app = express();

// Middleware
const corsOptions = {
  origin: "*", // Allow all origins for Docker networking
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("Health check endpoint accessed");
  res.status(200).json({ status: "ok", message: "AI Service is running" });
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, characterId } = req.body;

  if (!message) {
    console.warn("API request missing message", { characterId });
    return res.status(400).json({ error: "Message is required" });
  }

  console.log("Received chat request", {
    characterId,
    messageLength: message.length,
  });

  // Generate AI response using the character service
  const aiResponse = await ChatService.generateResponse(characterId, message);

  if (aiResponse) {
    console.log("Generated AI response", {
      characterId,
      responseLength: aiResponse.length,
    });
    res.json({ response: aiResponse });
  } else {
    // If no response was generated (likely due to API key issues), use fallback
    console.warn("No AI response generated, using fallback", { characterId });
    const fallbackResponse = ChatService.getFallbackResponse(characterId);
    console.log("Using fallback response for character", { characterId });
    res.json({ response: fallbackResponse });
  }
});

// AI Intro Message Generation endpoint
app.post("/api/generate-intro", async (req, res) => {
  const { character } = req.body;

  if (!character || !character.name || !character.personality) {
    console.warn("API request missing character data");
    return res.status(400).json({ error: "Character name and personality are required" });
  }

  console.log("Received intro generation request", {
    characterName: character.name,
  });

  try {
    // Generate intro message using ChatService
    const introMessage = await ChatService.generateIntroMessage(character);
    
    if (introMessage) {
      console.log("Generated intro message", {
        characterName: character.name,
        messageLength: introMessage.length,
      });
      res.json({ introMessage });
    } else {
      // Fallback intro message
      const fallback = `Hello! I'm ${character.name}. It's wonderful to meet you! I'm excited to chat with you today.`;
      res.json({ introMessage: fallback });
    }
  } catch (error) {
    console.error("Error generating intro message", error);
    const fallback = `Hello! I'm ${character.name}. It's wonderful to meet you! I'm excited to chat with you today.`;
    res.json({ introMessage: fallback });
  }
});

// AI Chat Summary endpoint
app.post("/api/generate-summary", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.warn("API request missing messages");
    return res.status(400).json({ error: "Messages array is required" });
  }

  console.log("Received summary generation request", {
    messageCount: messages.length,
  });

  try {
    // Use ChatService to generate summary since it already has OpenAI configured
    if (!process.env.OPENAI_CHAT_API_KEY) {
      console.warn("OPENAI_CHAT_API_KEY not set, using fallback");
      const fallbackSummary = `Conversation (${messages.length} messages)`;
      return res.json({ summary: fallbackSummary });
    }

    // Extract conversation content
    const conversationText = messages
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Character'}: ${msg.content}`)
      .join('\n');

    // Import OpenAI
    const { OpenAI } = require("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_CHAT_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates brief, concise summaries of conversations. Create a short title (3-7 words) that captures the main topic or theme of the conversation.",
        },
        {
          role: "user",
          content: `Summarize the main topic of this conversation in 3-7 words:\n\n${conversationText}`,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const summary = completion.choices[0].message.content.trim();

    console.log("Generated chat summary", {
      messageCount: messages.length,
      summaryLength: summary.length,
    });

    res.json({ summary });
  } catch (error) {
    console.error("Error generating chat summary:", error.message);

    // Fallback summary based on message count
    const fallbackSummary = `Conversation (${messages.length} messages)`;
    res.json({ summary: fallbackSummary });
  }
});

// AI Image Generation endpoint
app.post("/api/generate-image", async (req, res) => {
  const { description, personality, style } = req.body;

  if (!description) {
    console.warn("API request missing description");
    return res.status(400).json({ error: "Description is required" });
  }

  if (!style) {
    console.warn("API request missing style");
    return res.status(400).json({ error: "Style is required" });
  }

  console.log("Received image generation request", {
    style,
    descLength: description.length,
  });

  try {
    // Generate image using image service
    const imageUrl = await ImageService.generateImage({
      description,
      personality: personality || "",
      style,
    });

    console.log("Generated image", { style });
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error in image generation endpoint", error);

    // Use fallback image if generation fails
    const fallbackUrl = ImageService.getFallbackImage(style);
    console.log("Using fallback image", { style });

    res.json({ imageUrl: fallbackUrl });
  }
});

// Endpoint to fetch a specific character by ID
app.get("/api/characters/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    console.warn("API request missing character ID");
    return res.status(400).json({ error: "Character ID is required" });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || "http://backend:5000";
    const response = await axios.get(`${backendUrl}/api/characters/${id}`);

    if (response.data) {
      console.log(`Fetched character ${id} from backend`);
      res.json(response.data);
    } else {
      console.error("Invalid response format from backend API");
      res.status(500).json({ error: "Failed to fetch character data" });
    }
  } catch (error) {
    console.error(
      `Failed to fetch character ${id} from backend:`,
      error.message,
    );
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.msg || "Failed to fetch character data",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

// Function to fetch characters from the backend API
async function fetchCharacters() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://backend:5000";
    // Fetch public characters first
    const publicResponse = await axios.get(`${backendUrl}/api/characters`);

    let allCharacters = [];

    if (publicResponse.data && Array.isArray(publicResponse.data)) {
      console.log(
        `Fetched ${publicResponse.data.length} public characters from backend`,
      );
      allCharacters = [...publicResponse.data];
    }

    // We should ideally fetch private characters too, but that would require authentication
    // This would typically be implemented with a dedicated endpoint or service-to-service auth

    if (allCharacters.length > 0) {
      setCharacters(allCharacters);
      console.log(
        `Set ${allCharacters.length} total characters in the character cache`,
      );
    } else {
      console.error("No characters fetched from backend");
    }
  } catch (error) {
    console.error("Failed to fetch characters from backend:", error.message);
  }
}

module.exports = { app, fetchCharacters };