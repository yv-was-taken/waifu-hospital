import axios from 'axios';

// Get the AI API URL from environment variable or use localhost for development
const AI_API_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:5001';

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log the AI API URL for debugging
console.log('AI API URL:', AI_API_URL);

// Add response interceptor for handling errors
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI API Error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor
aiApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Generate a character image based on description, personality, and style
 * @param {object} params - Image generation params
 * @param {string} params.description - Character description
 * @param {string} params.personality - Character personality
 * @param {string} params.style - Visual style (anime, neogothic, etc.)
 * @returns {Promise<string>} URL of the generated image
 */
export const generateCharacterImage = async ({ description, personality, style }) => {
  try {
    const response = await aiApi.post('/api/generate-image', {
      description,
      personality,
      style
    });
    return response.data.imageUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
};

/**
 * Send a chat message to a character and get a response
 * @param {string} characterId - ID of the character (MongoDB ObjectId)
 * @param {string} message - User's message to the character
 * @returns {Promise<string>} Character's response
 */
export const sendChatMessage = async (characterId, message) => {
  try {
    const response = await aiApi.post('/api/chat', {
      characterId,
      message
    });
    return response.data.response;
  } catch (error) {
    console.error('Chat message failed:', error);
    throw error;
  }
};

export default aiApi;
