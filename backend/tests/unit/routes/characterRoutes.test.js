const request = require('supertest');
const express = require('express');
const characterRoutes = require('../../../routes/characterRoutes');
const characterController = require('../../../controllers/characterController');

// Mock the controllers
jest.mock('../../../controllers/characterController');

// Mock middleware
jest.mock('../../../middleware/authMiddleware', () => 
  jest.fn((req, res, next) => {
    req.user = { id: 'user123', username: 'testuser' };
    next();
  })
);

const mockAuth = require('../../../middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/characters', characterRoutes);

describe('Character Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/characters', () => {
    it('should call characterController.createCharacter with auth', async () => {
      characterController.createCharacter.mockImplementation((req, res) => {
        res.status(201).json({ 
          _id: 'char123',
          name: req.body.name,
          creator: req.user.id
        });
      });

      const response = await request(app)
        .post('/api/characters')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Character',
          description: 'A test character',
          personality: 'Friendly'
        });

      expect(response.status).toBe(201);
      expect(mockAuth).toHaveBeenCalled();
      expect(characterController.createCharacter).toHaveBeenCalled();
    });
  });

  describe('GET /api/characters', () => {
    it('should call characterController.getCharacters', async () => {
      characterController.getCharacters.mockImplementation((req, res) => {
        res.status(200).json([
          { _id: 'char1', name: 'Character 1' },
          { _id: 'char2', name: 'Character 2' }
        ]);
      });

      const response = await request(app)
        .get('/api/characters');

      expect(response.status).toBe(200);
      expect(characterController.getCharacters).toHaveBeenCalled();
    });

    it('should pass query parameters to controller', async () => {
      characterController.getCharacters.mockImplementation((req, res) => {
        expect(req.query.style).toBe('anime');
        expect(req.query.public).toBe('true');
        res.status(200).json([]);
      });

      await request(app)
        .get('/api/characters?style=anime&public=true');

      expect(characterController.getCharacters).toHaveBeenCalled();
    });
  });

  describe('GET /api/characters/user/:userId', () => {
    it('should call characterController.getUserCharacters with auth', async () => {
      characterController.getUserCharacters.mockImplementation((req, res) => {
        expect(req.params.userId).toBe('user123');
        res.status(200).json([
          { _id: 'char1', name: 'User Character 1', creator: 'user123' }
        ]);
      });

      const response = await request(app)
        .get('/api/characters/user/user123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(characterController.getUserCharacters).toHaveBeenCalled();
    });
  });

  describe('GET /api/characters/popular', () => {
    it('should call characterController.getPopularCharacters', async () => {
      characterController.getPopularCharacters.mockImplementation((req, res) => {
        res.status(200).json([
          { _id: 'char1', name: 'Popular Character 1', likes: 100 }
        ]);
      });

      const response = await request(app)
        .get('/api/characters/popular');

      expect(response.status).toBe(200);
      expect(characterController.getPopularCharacters).toHaveBeenCalled();
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should call characterController.getCharacterById', async () => {
      characterController.getCharacterById.mockImplementation((req, res) => {
        expect(req.params.id).toBe('char123');
        res.status(200).json({
          _id: 'char123',
          name: 'Test Character'
        });
      });

      const response = await request(app)
        .get('/api/characters/char123');

      expect(response.status).toBe(200);
      expect(characterController.getCharacterById).toHaveBeenCalled();
    });
  });

  describe('PUT /api/characters/:id', () => {
    it('should call characterController.updateCharacter with auth', async () => {
      characterController.updateCharacter.mockImplementation((req, res) => {
        expect(req.params.id).toBe('char123');
        expect(req.body.name).toBe('Updated Character');
        res.status(200).json({
          _id: 'char123',
          name: 'Updated Character'
        });
      });

      const response = await request(app)
        .put('/api/characters/char123')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Updated Character',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(characterController.updateCharacter).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should call characterController.deleteCharacter with auth', async () => {
      characterController.deleteCharacter.mockImplementation((req, res) => {
        expect(req.params.id).toBe('char123');
        res.status(200).json({ msg: 'Character deleted' });
      });

      const response = await request(app)
        .delete('/api/characters/char123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(characterController.deleteCharacter).toHaveBeenCalled();
    });
  });

  describe('POST /api/characters/:id/like', () => {
    it('should call characterController.likeCharacter with auth', async () => {
      characterController.likeCharacter.mockImplementation((req, res) => {
        expect(req.params.id).toBe('char123');
        res.status(200).json({ 
          msg: 'Character liked',
          likes: 1
        });
      });

      const response = await request(app)
        .post('/api/characters/char123/like')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(characterController.likeCharacter).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle controller errors', async () => {
      characterController.getCharacterById.mockImplementation((req, res) => {
        res.status(404).json({ error: 'Character not found' });
      });

      const response = await request(app)
        .get('/api/characters/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Character not found');
    });

    it('should handle missing authentication for protected routes', async () => {
      // Override auth middleware to simulate no token
      mockAuth.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'No token provided' });
      });

      const response = await request(app)
        .post('/api/characters')
        .send({
          name: 'Test Character'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Route parameter validation', () => {
    it('should handle invalid character ID format', async () => {
      characterController.getCharacterById.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Invalid character ID' });
      });

      const response = await request(app)
        .get('/api/characters/invalid-id');

      expect(response.status).toBe(400);
    });

    it('should handle invalid user ID format', async () => {
      characterController.getUserCharacters.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Invalid user ID' });
      });

      const response = await request(app)
        .get('/api/characters/user/invalid-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
    });
  });

  describe('HTTP methods', () => {
    it('should reject unsupported methods', async () => {
      const response = await request(app)
        .patch('/api/characters/char123');

      expect(response.status).toBe(404);
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/characters');

      // Express typically handles OPTIONS automatically
      expect([200, 404]).toContain(response.status);
    });
  });
});