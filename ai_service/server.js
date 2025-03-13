require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const ChatService = require("./services/ChatService");
const ImageService = require("./services/ImageService");
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

// Start the server
app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);

  // Fetch characters initially
  fetchCharacters();

  // Set up periodic refresh of characters (every 5 minutes)
  setInterval(fetchCharacters, 5 * 60 * 1000);
});
