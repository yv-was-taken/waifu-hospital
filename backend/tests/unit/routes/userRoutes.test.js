const request = require('supertest');
const express = require('express');
const userRoutes = require('../../../routes/userRoutes');
const userController = require('../../../controllers/userController');

// Mock the controllers
jest.mock('../../../controllers/userController');

// Mock middleware
jest.mock('../../../middleware/authMiddleware', () => 
  jest.fn((req, res, next) => {
    req.user = { id: 'user123', username: 'testuser' };
    next();
  })
);

// Mock express-validator
jest.mock('express-validator', () => ({
  check: () => ({
    not: () => ({
      isEmpty: () => (req, res, next) => next()
    }),
    isEmail: () => (req, res, next) => next(),
    isLength: () => (req, res, next) => next(),
    exists: () => (req, res, next) => next()
  })
}));

const mockAuth = require('../../../middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should call userController.registerUser', async () => {
      userController.registerUser.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(userController.registerUser).toHaveBeenCalled();
    });
  });

  describe('POST /api/users/login', () => {
    it('should call userController.loginUser', async () => {
      userController.loginUser.mockImplementation((req, res) => {
        res.status(200).json({ token: 'test-token' });
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(userController.loginUser).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/profile', () => {
    it('should call userController.getUserProfile with auth middleware', async () => {
      userController.getUserProfile.mockImplementation((req, res) => {
        res.status(200).json({ user: req.user });
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(userController.getUserProfile).toHaveBeenCalled();
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should call userController.updateUserProfile with auth middleware', async () => {
      userController.updateUserProfile.mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer test-token')
        .send({
          username: 'updateduser',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(mockAuth).toHaveBeenCalled();
      expect(userController.updateUserProfile).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/creators', () => {
    it('should call userController.getCreators', async () => {
      userController.getCreators.mockImplementation((req, res) => {
        res.status(200).json([
          { _id: 'creator1', username: 'creator1' }
        ]);
      });

      const response = await request(app)
        .get('/api/users/creators');

      expect(response.status).toBe(200);
      expect(userController.getCreators).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should call userController.getUserById', async () => {
      userController.getUserById.mockImplementation((req, res) => {
        expect(req.params.id).toBe('user123');
        res.status(200).json({ 
          _id: 'user123',
          username: 'testuser'
        });
      });

      const response = await request(app)
        .get('/api/users/user123');

      expect(response.status).toBe(200);
      expect(userController.getUserById).toHaveBeenCalled();
    });
  });

  describe('Route parameters and middleware', () => {
    it('should pass request data to controllers', async () => {
      userController.registerUser.mockImplementation((req, res) => {
        expect(req.body.username).toBe('testuser');
        expect(req.body.email).toBe('test@example.com');
        res.status(201).json({ success: true });
      });

      await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(userController.registerUser).toHaveBeenCalled();
    });

    it('should handle middleware authentication', async () => {
      userController.getUserProfile.mockImplementation((req, res) => {
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe('user123');
        res.status(200).json({ user: req.user });
      });

      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer test-token');

      expect(mockAuth).toHaveBeenCalled();
      expect(userController.getUserProfile).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle controller errors', async () => {
      userController.registerUser.mockImplementation((req, res) => {
        res.status(400).json({ error: 'User already exists' });
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should handle missing required fields', async () => {
      userController.registerUser.mockImplementation((req, res) => {
        res.status(400).json({ error: 'All fields required' });
      });

      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser'
          // missing email and password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('HTTP methods', () => {
    it('should only accept POST for register', async () => {
      const response = await request(app)
        .get('/api/users/register');

      expect(response.status).toBe(404);
    });

    it('should only accept POST for login', async () => {
      const response = await request(app)
        .get('/api/users/login');

      expect(response.status).toBe(404);
    });

    it('should only accept GET for /profile', async () => {
      const response = await request(app)
        .post('/api/users/profile');

      expect(response.status).toBe(404);
    });

    it('should only accept PUT for profile update', async () => {
      const response = await request(app)
        .post('/api/users/profile');

      expect(response.status).toBe(404);
    });
  });
});