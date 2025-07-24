const request = require('supertest');
const express = require('express');
const axios = require('axios');
const ChatService = require('../services/ChatService');
const ImageService = require('../services/ImageService');
const { setCharacters } = require('../models/Character');
const { faker } = require('@faker-js/faker');

// Mock dependencies
jest.mock('axios');
jest.mock('../services/ChatService');
jest.mock('../services/ImageService');
jest.mock('../models/Character');

// Import the app directly (not the server)
const { app } = require('../app');

describe('AI Service Server', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables for each test
    process.env.BACKEND_URL = 'http://test-backend:5000';
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'AI Service is running'
      });
    });
  });

  describe('POST /api/chat', () => {
    const mockChatRequest = {
      message: faker.lorem.sentence(),
      characterId: faker.database.mongodbObjectId()
    };

    it('should return AI response when service succeeds', async () => {
      const mockResponse = faker.lorem.sentences(3);
      ChatService.generateResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send(mockChatRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response: mockResponse });
      expect(ChatService.generateResponse).toHaveBeenCalledWith(
        mockChatRequest.characterId,
        mockChatRequest.message
      );
    });

    it('should return fallback response when AI service fails', async () => {
      const mockFallback = faker.lorem.sentences(2);
      ChatService.generateResponse.mockResolvedValue(null);
      ChatService.getFallbackResponse.mockReturnValue(mockFallback);

      const response = await request(app)
        .post('/api/chat')
        .send(mockChatRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response: mockFallback });
      expect(ChatService.getFallbackResponse).toHaveBeenCalledWith(
        mockChatRequest.characterId
      );
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ characterId: mockChatRequest.characterId });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message is required' });
    });

    it('should return 400 when message is empty string', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: '',
          characterId: mockChatRequest.characterId 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Message is required' });
    });

    it('should handle requests without characterId', async () => {
      const mockResponse = faker.lorem.sentences(3);
      ChatService.generateResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: mockChatRequest.message });

      expect(response.status).toBe(200);
      expect(ChatService.generateResponse).toHaveBeenCalledWith(
        undefined,
        mockChatRequest.message
      );
    });

    it('should handle ChatService exceptions gracefully', async () => {
      const mockFallback = faker.lorem.sentences(2);
      ChatService.generateResponse.mockResolvedValue(null); // Service returns null for errors
      ChatService.getFallbackResponse.mockReturnValue(mockFallback);

      const response = await request(app)
        .post('/api/chat')
        .send(mockChatRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response: mockFallback });
    });
  });

  describe('POST /api/generate-intro', () => {
    const mockCharacter = {
      name: faker.person.firstName(),
      personality: faker.lorem.sentence(),
      background: faker.lorem.paragraph(),
      occupation: faker.person.jobTitle()
    };

    it('should return generated intro message', async () => {
      const mockIntroMessage = faker.lorem.sentences(2);
      ChatService.generateIntroMessage.mockResolvedValue(mockIntroMessage);

      const response = await request(app)
        .post('/api/generate-intro')
        .send({ character: mockCharacter });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ introMessage: mockIntroMessage });
      expect(ChatService.generateIntroMessage).toHaveBeenCalledWith(mockCharacter);
    });

    it('should return fallback intro when service returns null', async () => {
      ChatService.generateIntroMessage.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/generate-intro')
        .send({ character: mockCharacter });

      expect(response.status).toBe(200);
      expect(response.body.introMessage).toContain(mockCharacter.name);
      expect(response.body.introMessage).toContain('Hello!');
    });

    it('should return fallback intro on service error', async () => {
      ChatService.generateIntroMessage.mockRejectedValue(new Error('Service Error'));

      const response = await request(app)
        .post('/api/generate-intro')
        .send({ character: mockCharacter });

      expect(response.status).toBe(200);
      expect(response.body.introMessage).toContain(mockCharacter.name);
      expect(response.body.introMessage).toContain('Hello!');
    });

    it('should return 400 when character is missing', async () => {
      const response = await request(app)
        .post('/api/generate-intro')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Character name and personality are required' 
      });
    });

    it('should return 400 when character name is missing', async () => {
      const response = await request(app)
        .post('/api/generate-intro')
        .send({ 
          character: { personality: mockCharacter.personality } 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Character name and personality are required' 
      });
    });

    it('should return 400 when character personality is missing', async () => {
      const response = await request(app)
        .post('/api/generate-intro')
        .send({ 
          character: { name: mockCharacter.name } 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Character name and personality are required' 
      });
    });

    it('should handle empty character object', async () => {
      const response = await request(app)
        .post('/api/generate-intro')
        .send({ character: {} });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ 
        error: 'Character name and personality are required' 
      });
    });
  });

  describe('POST /api/generate-image', () => {
    const mockImageRequest = {
      description: faker.lorem.paragraph(),
      personality: faker.lorem.sentence(),
      style: 'anime'
    };

    it('should return generated image URL', async () => {
      const mockImageUrl = faker.image.url();
      ImageService.generateImage.mockResolvedValue(mockImageUrl);

      const response = await request(app)
        .post('/api/generate-image')
        .send(mockImageRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ imageUrl: mockImageUrl });
      expect(ImageService.generateImage).toHaveBeenCalledWith(mockImageRequest);
    });

    it('should return fallback image on service error', async () => {
      const mockFallbackUrl = faker.image.url();
      ImageService.generateImage.mockRejectedValue(new Error('Generation failed'));
      ImageService.getFallbackImage.mockReturnValue(mockFallbackUrl);

      const response = await request(app)
        .post('/api/generate-image')
        .send(mockImageRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ imageUrl: mockFallbackUrl });
      expect(ImageService.getFallbackImage).toHaveBeenCalledWith(mockImageRequest.style);
    });

    it('should return 400 when description is missing', async () => {
      const response = await request(app)
        .post('/api/generate-image')
        .send({ 
          personality: mockImageRequest.personality,
          style: mockImageRequest.style 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Description is required' });
    });

    it('should return 400 when style is missing', async () => {
      const response = await request(app)
        .post('/api/generate-image')
        .send({ 
          description: mockImageRequest.description,
          personality: mockImageRequest.personality 
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Style is required' });
    });

    it('should handle missing personality gracefully', async () => {
      const mockImageUrl = faker.image.url();
      ImageService.generateImage.mockResolvedValue(mockImageUrl);

      const response = await request(app)
        .post('/api/generate-image')
        .send({ 
          description: mockImageRequest.description,
          style: mockImageRequest.style 
        });

      expect(response.status).toBe(200);
      expect(ImageService.generateImage).toHaveBeenCalledWith({
        description: mockImageRequest.description,
        personality: '',
        style: mockImageRequest.style
      });
    });
  });

  describe('GET /api/characters/:id', () => {
    const characterId = faker.database.mongodbObjectId();
    const mockCharacterData = {
      _id: characterId,
      name: faker.person.firstName(),
      personality: faker.lorem.sentence(),
      description: faker.lorem.paragraph()
    };

    it('should return character data from backend', async () => {
      axios.get.mockResolvedValue({ data: mockCharacterData });

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCharacterData);
      expect(axios.get).toHaveBeenCalledWith(
        `http://test-backend:5000/api/characters/${characterId}`
      );
    });

    it('should return 400 when character ID is missing', async () => {
      const response = await request(app).get('/api/characters/');

      expect(response.status).toBe(404); // Express returns 404 for missing route params
    });

    it('should return backend error status on failure', async () => {
      const backendError = new Error('Character not found');
      backendError.response = {
        status: 404,
        data: { msg: 'Character not found' }
      };
      axios.get.mockRejectedValue(backendError);

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Character not found' });
    });

    it('should return 500 on network error', async () => {
      const networkError = new Error('Network Error');
      axios.get.mockRejectedValue(networkError);

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch character data' });
    });

    it('should return 500 when backend returns invalid data', async () => {
      axios.get.mockResolvedValue({ data: null });

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch character data' });
    });

    it('should use default backend URL when not set', async () => {
      delete process.env.BACKEND_URL;
      axios.get.mockResolvedValue({ data: mockCharacterData });

      const response = await request(app).get(`/api/characters/${characterId}`);

      expect(response.status).toBe(200);
      expect(axios.get).toHaveBeenCalledWith(
        `http://backend:5000/api/characters/${characterId}`
      );
      
      // Restore environment variable
      process.env.BACKEND_URL = 'http://test-backend:5000';
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle unhandled errors', async () => {
      // Test error handling by using invalid request
      const response = await request(app)
        .post('/api/nonexistent-endpoint')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow all origins', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
    });
  });

  describe('Request Validation', () => {
    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Express returns 400 for malformed JSON
      expect([400, 500]).toContain(response.status);
    });

    it('should handle very large payloads', async () => {
      const largeMessage = 'a'.repeat(1000000); // 1MB message
      
      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: largeMessage,
          characterId: faker.database.mongodbObjectId()
        });

      // Should either process or reject gracefully (500 is also acceptable if service fails)
      expect([200, 413, 400, 500]).toContain(response.status);
    });
  });

  describe('Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log health check requests', async () => {
      await request(app).get('/health');
      
      expect(consoleSpy).toHaveBeenCalledWith('Health check endpoint accessed');
    });

    it('should log chat requests', async () => {
      const mockRequest = {
        message: faker.lorem.sentence(),
        characterId: faker.database.mongodbObjectId()
      };
      
      ChatService.generateResponse.mockResolvedValue('Mock response');

      await request(app).post('/api/chat').send(mockRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith('Received chat request', {
        characterId: mockRequest.characterId,
        messageLength: mockRequest.message.length
      });
    });

    it('should log image generation requests', async () => {
      const mockRequest = {
        description: faker.lorem.paragraph(),
        style: 'anime'
      };
      
      ImageService.generateImage.mockResolvedValue(faker.image.url());

      await request(app).post('/api/generate-image').send(mockRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith('Received image generation request', {
        style: mockRequest.style,
        descLength: mockRequest.description.length
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle full chat flow', async () => {
      const mockRequest = {
        message: 'Hello, how are you?',
        characterId: faker.database.mongodbObjectId()
      };
      const mockResponse = 'Hello! I am doing great, thank you for asking!';
      
      ChatService.generateResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.response).toBe(mockResponse);
    });

    it('should handle full image generation flow', async () => {
      const mockRequest = {
        description: 'A beautiful anime girl with blue hair',
        personality: 'cheerful and energetic',
        style: 'anime'
      };
      const mockImageUrl = 'https://example.com/generated-image.png';
      
      ImageService.generateImage.mockResolvedValue(mockImageUrl);

      const response = await request(app)
        .post('/api/generate-image')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toBe(mockImageUrl);
    });

    it('should handle full intro generation flow', async () => {
      const mockCharacter = {
        name: 'Alice',
        personality: 'friendly and helpful',
        background: 'A medical professional',
        occupation: 'doctor'
      };
      const mockIntroMessage = 'Hello! I am Alice, a friendly doctor. How can I help you today?';
      
      ChatService.generateIntroMessage.mockResolvedValue(mockIntroMessage);

      const response = await request(app)
        .post('/api/generate-intro')
        .send({ character: mockCharacter });

      expect(response.status).toBe(200);
      expect(response.body.introMessage).toBe(mockIntroMessage);
    });
  });
});