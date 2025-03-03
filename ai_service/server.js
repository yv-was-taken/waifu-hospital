require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ChatService = require('./services/ChatService');
const ImageService = require('./services/ImageService');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: '*', // Allow all origins for Docker networking
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.status(200).json({ status: 'ok', message: 'AI Service is running' });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, characterId } = req.body;
  
  if (!message) {
    logger.warn('API request missing message', { characterId });
    return res.status(400).json({ error: 'Message is required' });
  }
  
  logger.debug('Received chat request', { characterId, messageLength: message.length });
  
  try {
    // Generate AI response using the character service
    const aiResponse = await ChatService.generateResponse(characterId, message);
    logger.info('Generated AI response', { characterId, responseLength: aiResponse.length });
    
    res.json({ response: aiResponse });
  } catch (error) {
    logger.error('Error in AI chat endpoint', error);
    
    // Use fallback response if AI generation fails
    const fallbackResponse = ChatService.getFallbackResponse();
    logger.info('Using fallback response', { characterId });
    
    res.json({ response: fallbackResponse });
  }
});

// AI Image Generation endpoint
app.post('/api/generate-image', async (req, res) => {
  const { description, personality, style } = req.body;
  
  if (!description) {
    logger.warn('API request missing description');
    return res.status(400).json({ error: 'Description is required' });
  }
  
  if (!style) {
    logger.warn('API request missing style');
    return res.status(400).json({ error: 'Style is required' });
  }
  
  logger.debug('Received image generation request', { style, descLength: description.length });
  
  try {
    // Generate image using image service
    const imageUrl = await ImageService.generateImage({
      description,
      personality: personality || '',
      style
    });
    
    logger.info('Generated image', { style });
    res.json({ imageUrl });
  } catch (error) {
    logger.error('Error in image generation endpoint', error);
    
    // Use fallback image if generation fails
    const fallbackUrl = ImageService.getFallbackImage(style);
    logger.info('Using fallback image', { style });
    
    res.json({ imageUrl: fallbackUrl });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`AI Service running on port ${PORT}`);
});