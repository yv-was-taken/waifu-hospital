require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const ChatService = require("./services/ChatService");
const ImageService = require("./services/ImageService");
const logger = require("./utils/logger");
const { setCharacters } = require("./models/Character");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

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
  logger.info("Health check endpoint accessed");
  res.status(200).json({ status: "ok", message: "AI Service is running" });
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, characterId } = req.body;

  if (!message) {
    logger.warn("API request missing message", { characterId });
    return res.status(400).json({ error: "Message is required" });
  }

  logger.debug("Received chat request", {
    characterId,
    messageLength: message.length,
  });

  // Generate AI response using the character service
  const aiResponse = await ChatService.generateResponse(characterId, message);

  if (aiResponse) {
    logger.info("Generated AI response", {
      characterId,
      responseLength: aiResponse.length,
    });
    res.json({ response: aiResponse });
  } else {
    // If no response was generated (likely due to API key issues), use fallback
    logger.warn("No AI response generated, using fallback", { characterId });
    const fallbackResponse = ChatService.getFallbackResponse(characterId);
    logger.info("Using fallback response for character", { characterId });
    res.json({ response: fallbackResponse });
  }
});

// AI Image Generation endpoint
app.post("/api/generate-image", async (req, res) => {
  const { description, personality, style } = req.body;

  if (!description) {
    logger.warn("API request missing description");
    return res.status(400).json({ error: "Description is required" });
  }

  if (!style) {
    logger.warn("API request missing style");
    return res.status(400).json({ error: "Style is required" });
  }

  logger.debug("Received image generation request", {
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

    logger.info("Generated image", { style });
    res.json({ imageUrl });
  } catch (error) {
    logger.error("Error in image generation endpoint", error);

    // Use fallback image if generation fails
    const fallbackUrl = ImageService.getFallbackImage(style);
    logger.info("Using fallback image", { style });

    res.json({ imageUrl: fallbackUrl });
  }
});

// Endpoint to fetch a specific character by ID
app.get("/api/characters/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    logger.warn("API request missing character ID");
    return res.status(400).json({ error: "Character ID is required" });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || "http://backend:5000";
    const response = await axios.get(`${backendUrl}/api/characters/${id}`);

    if (response.data) {
      logger.info(`Fetched character ${id} from backend`);
      res.json(response.data);
    } else {
      logger.error("Invalid response format from backend API");
      res.status(500).json({ error: "Failed to fetch character data" });
    }
  } catch (error) {
    logger.error(
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
  logger.error("Unhandled error", err);
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
      logger.info(
        `Fetched ${publicResponse.data.length} public characters from backend`,
      );
      allCharacters = [...publicResponse.data];
    }

    // We should ideally fetch private characters too, but that would require authentication
    // This would typically be implemented with a dedicated endpoint or service-to-service auth

    if (allCharacters.length > 0) {
      setCharacters(allCharacters);
      logger.info(
        `Set ${allCharacters.length} total characters in the character cache`,
      );
    } else {
      logger.error("No characters fetched from backend");
    }
  } catch (error) {
    logger.error("Failed to fetch characters from backend:", error.message);
  }
}

// Start the server
app.listen(PORT, () => {
  logger.info(`AI Service running on port ${PORT}`);

  // Fetch characters initially
  fetchCharacters();

  // Set up periodic refresh of characters (every 5 minutes)
  setInterval(fetchCharacters, 5 * 60 * 1000);
});
