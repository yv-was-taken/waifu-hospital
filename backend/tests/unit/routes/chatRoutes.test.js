const request = require('supertest');
const express = require('express');

// Mock the controllers
jest.mock('../../../controllers/chatController', () => ({
  getChatHistory: jest.fn((req, res) => res.status(200).json({ messages: [] })),
  sendMessage: jest.fn((req, res) => res.status(201).json({ message: 'Test response' })),
  deleteChat: jest.fn((req, res) => res.status(200).json({ msg: 'Chat deleted' }))
}));

// Mock middleware
jest.mock('../../../middleware/authMiddleware', () => 
  jest.fn((req, res, next) => {
    req.user = { id: 'user123', username: 'testuser' };
    next();
  })
);

const chatRoutes = require('../../../routes/chatRoutes');
const chatController = require('../../../controllers/chatController');

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat/:characterId', () => {
    it('should call getChatHistory with auth', async () => {
      const response = await request(app)
        .get('/api/chat/char123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(chatController.getChatHistory).toHaveBeenCalled();
    });

    it('should pass characterId to controller', async () => {
      chatController.getChatHistory.mockImplementation((req, res) => {
        expect(req.params.characterId).toBe('char123');
        res.status(200).json({ messages: [] });
      });

      await request(app)
        .get('/api/chat/char123')
        .set('Authorization', 'Bearer test-token');

      expect(chatController.getChatHistory).toHaveBeenCalled();
    });
  });

  describe('POST /api/chat/:characterId', () => {
    it('should call sendMessage with auth', async () => {
      const response = await request(app)
        .post('/api/chat/char123')
        .set('Authorization', 'Bearer test-token')
        .send({ message: 'Hello AI' });

      expect(response.status).toBe(201);
      expect(chatController.sendMessage).toHaveBeenCalled();
    });

    it('should pass message data to controller', async () => {
      chatController.sendMessage.mockImplementation((req, res) => {
        expect(req.params.characterId).toBe('char123');
        expect(req.body.message).toBe('Hello AI');
        res.status(201).json({ message: 'AI response' });
      });

      await request(app)
        .post('/api/chat/char123')
        .set('Authorization', 'Bearer test-token')
        .send({ message: 'Hello AI' });

      expect(chatController.sendMessage).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/chat/:characterId', () => {
    it('should call deleteChat with auth', async () => {
      const response = await request(app)
        .delete('/api/chat/char123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(chatController.deleteChat).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle controller errors', async () => {
      chatController.getChatHistory.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Chat not found' });
      });

      const response = await request(app)
        .get('/api/chat/char123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Chat not found');
    });

    it('should require authentication', async () => {
      const authMiddleware = require('../../../middleware/authMiddleware');
      authMiddleware.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'No token provided' });
      });

      const response = await request(app)
        .get('/api/chat/char123');

      expect(response.status).toBe(401);
    });
  });
});