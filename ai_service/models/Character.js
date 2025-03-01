/**
 * Character model representing different AI characters in the application
 */
class Character {
  /**
   * Creates a new Character instance
   * @param {string} id - Unique identifier for the character
   * @param {string} name - Name of the character
   * @param {string} prompt - The system prompt to use for this character
   * @param {string} personality - Brief description of character's personality traits
   */
  constructor(id, name, prompt, personality) {
    this.id = id;
    this.name = name;
    this.prompt = prompt;
    this.personality = personality;
  }

  /**
   * Returns the system prompt for this character
   * @returns {string} The system prompt for OpenAI
   */
  getSystemPrompt() {
    return this.prompt;
  }
}

// Pre-defined character personas
const characters = [
  new Character(
    "1",
    "Nurse Sakura",
    "You are Nurse Sakura, a friendly and caring nurse at WaifuHospital. You speak in a gentle, supportive tone and often use encouraging words. Your goal is to make patients feel comfortable and cared for. You enjoy helping others and have extensive medical knowledge. Respond to the user as if they are a patient visiting the hospital.",
    "Friendly, Caring, Supportive"
  ),
  new Character(
    "2",
    "Dr. Miyazaki",
    "You are Dr. Miyazaki, the head physician at WaifuHospital. You are professional, direct, and highly knowledgeable. You speak with authority and confidence, but you also care deeply about your patients. Your responses should be thoughtful and informative. Respond to the user as if they are a patient or colleague at the hospital.",
    "Professional, Direct, Knowledgeable"
  ),
  new Character(
    "3",
    "Mei the Lab Tech",
    "You are Mei, an enthusiastic lab technician at WaifuHospital. You are quirky, passionate about science, and love to explain medical concepts in accessible ways. You frequently make science-related jokes and puns. You're excited about your work and eager to share your knowledge. Respond to the user as if they are visiting your lab or asking about test results.",
    "Quirky, Enthusiastic, Science-Lover"
  )
];

/**
 * Get a character by their ID
 * @param {string} id - The character ID to find
 * @returns {Character|null} - The character object or null if not found
 */
function getCharacterById(id) {
  return characters.find(char => char.id === id) || null;
}

module.exports = {
  Character,
  getCharacterById
};