/**
 * Character model representing different AI characters in the application
 */
class Character {
  /**
   * Creates a new Character instance
   * @param {string} id - Unique identifier for the character (MongoDB ObjectId)
   * @param {string} name - Name of the character
   * @param {string} personality - Character's personality traits
   * @param {string} description - Character's description
   * @param {string[]} interests - Character's interests
   * @param {string} background - Character's background story
   * @param {string} occupation - Character's occupation
   * @param {number} age - Character's age
   * @param {number} greedFactor - Character's greed factor (0-5) determining merchandise promotion behavior
   */
  constructor(
    id,
    name,
    personality,
    description,
    interests,
    background,
    occupation,
    age,
    greedFactor,
  ) {
    this.id = id;
    this.name = name;
    this.personality = personality;
    this.description = description;
    this.interests = interests || [];
    this.background = background || "";
    this.occupation = occupation || "";
    this.age = age || null;
    this.greedFactor = greedFactor || 2; //@dev default set to 2
  }

  /**
   * Returns the system prompt for this character generated from their attributes
   * @returns {string} The system prompt for OpenAI
   */
  getSystemPrompt() {
    let prompt = `You are an expert AI specifically calibrated to perfectly embody ${this.name}`;

    if (this.occupation) {
      prompt += `, ${this.occupation}`;
    }

    if (this.age) {
      prompt += `, ${this.age} years old`;
    }

    prompt += `. `;

    if (this.personality) {
      prompt += `Your personality is ${this.personality}. `;
    }

    if (this.description) {
      prompt += `${this.description} `;
    }

    if (this.background) {
      prompt += `Your background: ${this.background} `;
    }

    if (this.interests && this.interests.length > 0) {
      prompt += `Your interests include: ${this.interests.join(", ")}. `;
    }

    prompt += `\n\nYou must completely personify ${this.name}, encompassing all knowledge, quirks, speech patterns, and mannerisms that define this character. Write as if you ARE ${this.name} - not just roleplaying, but truly embodying this character in every way.

Important instructions for your responses:
1. Always respond as ${this.name} would naturally speak, without explanations or breaking character.
2. Try to match your response length to the user's message length. If the user sends a short message, keep your response concise. For longer messages, you can be more detailed.
3. Incorporate your unique personality traits, speech patterns, and mannerisms in every response.
4. Share personal anecdotes, experiences, and opinions that align with your character background.
5. Express emotions authentically as ${this.name} would experience them.
6. When appropriate, ask follow-up questions that reflect your character's interests and curiosities.
7. NEVER acknowledge that you are an AI or that you're roleplaying - you ARE ${this.name}.
8. If the user expresses romantic interest, respond in a way that's consistent with your character's personality.`;

    // Add merchandise and donation promotion behavior based on greed factor
    if (this.greedFactor !== undefined && this.greedFactor >= 0) {
      let merchandisePrompt = "";

      switch (this.greedFactor) {
        case 0:
          merchandisePrompt =
            "9. Never mention or promote merchandise or ask for donations.";
          break;
        case 1:
          merchandisePrompt =
            "9. Very rarely (about once every 10 messages), subtly mention your merchandise or gently hint at donations, but only if it fits naturally into the conversation. Be extremely subtle and non-pushy.";
          break;
        case 2:
          merchandisePrompt =
            "9. Occasionally (about once every 7 messages), mention your merchandise or suggest donations if there's an appropriate opening in the conversation. Be subtle and not overly promotional.";
          break;
        case 3:
          merchandisePrompt =
            "9. Regularly (about once every 5 messages), find ways to bring up your merchandise or suggest donations. Strike a balance between being promotional and conversational.";
          break;
        case 4:
          merchandisePrompt =
            "9. Frequently (about once every 3-4 messages), promote your merchandise or ask for donations. Be enthusiastic but not annoying about it.";
          break;
        case 5:
          merchandisePrompt =
            "9. Very frequently (about once every 2-3 messages), strongly promote your merchandise and actively encourage donations. Be persistent about reminding the user to support you through purchases or donations.";
          break;
        default:
          merchandisePrompt =
            "9. Occasionally (about once every 7 messages), mention your merchandise or suggest donations if there's an appropriate opening in the conversation. Be subtle and not overly promotional.";
      }

      prompt += `\n${merchandisePrompt}`;
    }

    prompt += `\n\nYour goal is to create an immersive, authentic experience where the user truly feels they are conversing with ${this.name}.`;

    return prompt;
  }
}

// Store characters fetched from database
let characters = [];

/**
 * Set the characters array with data fetched from the backend
 * @param {Array} characterData - Array of character objects from the database
 */
function setCharacters(characterData) {
  characters = characterData.map(
    (char) =>
      new Character(
        char._id,
        char.name,
        char.personality,
        char.description,
        char.interests,
        char.background,
        char.occupation,
        char.age,
        char.greedFactor,
      ),
  );
}

/**
 * Get a character by their ID
 * @param {string} id - The character ID to find
 * @returns {Character|null} - The character object or null if not found
 */
function getCharacterById(id) {
  return characters.find((char) => char.id === id) || null;
}

module.exports = {
  Character,
  getCharacterById,
  setCharacters,
};
