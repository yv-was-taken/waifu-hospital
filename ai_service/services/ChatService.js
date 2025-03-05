const { OpenAI } = require("openai");
const axios = require("axios");
const { getCharacterById, Character } = require("../models/Character");

/**
 * Service handling AI chat interactions
 */
class ChatService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_CHAT_API_KEY,
    });
  }

  /**
   * Generate a response from a character to a user message
   *
   * @param {string} characterId - ID of the character to respond as
   * @param {string} userMessage - The user's message
   * @returns {Promise<string>} The AI-generated response
   * @throws {Error} If the character doesn't exist or API call fails
   */
  async generateResponse(characterId, userMessage) {
    // Get the character from local cache
    let character = getCharacterById(characterId);

    // If character not found in cache, try to fetch it from the backend
    if (!character) {
      try {
        console.log(
          `Character ${characterId} not found in cache, fetching from backend...`,
        );

        // Get the backend URL from environment or use default Docker service name
        const backendUrl = process.env.BACKEND_URL || "http://backend:5000";
        const response = await axios.get(
          `${backendUrl}/api/characters/${characterId}`,
        );

        if (response.data) {
          // Create a Character instance from the response data
          const charData = response.data;
          character = new Character(
            charData._id,
            charData.name,
            charData.personality,
            charData.description,
            charData.interests,
            charData.background,
            charData.occupation,
            charData.age,
            charData.greedFactor,
          );
        }
      } catch (error) {
        console.error(
          `Failed to fetch character ${characterId} from backend:`,
          error.message,
        );
        throw new Error(`Character with ID ${characterId} not found`);
      }
    }

    if (!character) {
      throw new Error(
        `Character with ID ${characterId} not found after fetch attempt`,
      );
    }

    try {
      // Generate the system prompt from character attributes
      const systemPrompt = character.getSystemPrompt();
      console.log(
        `Generated system prompt for ${character.name}:`,
        systemPrompt,
      );

      // Check if the API key is set
      if (!process.env.OPENAI_CHAT_API_KEY) {
        console.error(
          "OPENAI_CHAT_API_KEY is not set in the environment variables",
        );
        throw new Error("OpenAI API key is missing");
      }

      // Call OpenAI API
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        return completion.choices[0].message.content;
      } catch (apiError) {
        // Detailed logging for API errors
        if (apiError.response) {
          console.error("OpenAI API Error Response:", {
            status: apiError.response.status,
            data: apiError.response.data,
          });
        } else if (apiError.message.includes("auth")) {
          console.error(
            "Authentication error with OpenAI API. Check your API key:",
            apiError.message,
          );
        } else {
          console.error("OpenAI API error:", apiError);
        }
        // Don't throw, let the fallback response handle it
        return null;
      }
    } catch (error) {
      console.error("Failed to generate AI response:", error.message);
      // Return null instead of throwing, to let the caller use the fallback response
      return null;
    }
  }

  /**
   * Get a fallback response when AI service fails
   * @param {string} characterId - ID of the character to respond as
   * @returns {string} A character-aware fallback response
   */
  getFallbackResponse(characterId) {
    // Try to get the character to personalize the fallback response
    const character = getCharacterById(characterId);

    if (character) {
      // Character-specific fallback responses
      return `Hi there! I'm ${character.name}${character.occupation ? `, ${character.occupation}` : ""}. ${
        character.personality
          ? `I'm known for being ${character.personality}.`
          : ""
      } ${
        character.interests && character.interests.length > 0
          ? `I'm interested in ${character.interests.join(", ")}.`
          : ""
      } What would you like to talk about?`;
    }

    // Generic fallback responses if no character is found
    const fallbackResponses = [
      "Hi there! I'd love to chat with you. What would you like to talk about?",
      "Hello! I'm excited to get to know you better. Feel free to ask me anything!",
      "Hey! I'm here and ready to chat. What's on your mind today?",
      "Hi! It's nice to meet you. I'd love to hear more about you!",
      "Hello there! I'm looking forward to our conversation. What interests you?",
    ];

    return fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];
  }
}

module.exports = new ChatService();
