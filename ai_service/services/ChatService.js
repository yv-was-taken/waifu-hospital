const { OpenAI } = require('openai');
const { getCharacterById } = require('../models/Character');

/**
 * Service handling AI chat interactions
 */
class ChatService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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
    // Get the character
    const character = getCharacterById(characterId);
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    try {
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: character.getSystemPrompt() },
          { role: "user", content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  /**
   * Get a fallback response when AI service fails
   * @returns {string} A static fallback response
   */
  getFallbackResponse() {
    const fallbackResponses = [
      "I'm sorry, I'm having trouble processing that right now. Could we talk about something else?",
      "Hmm, that's interesting! Can you tell me more about that?",
      "I'd like to hear more about your thoughts on this topic.",
      "Let's discuss this further. What else would you like to know?",
      "That's a good point. I appreciate you sharing that with me.",
      "I see what you mean. How does that make you feel?"
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

module.exports = new ChatService();