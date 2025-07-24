const userController = require('../../../controllers/userController');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    beforeEach(() => {
      req.body = {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      };
    });

    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await userController.registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ 
        $or: [
          { email: req.body.email.toLowerCase() },
          { username: req.body.username }
        ]
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email
        }
      });
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        _id: faker.database.mongodbObjectId(),
        username: req.body.username,
        email: req.body.email
      };

      User.findOne.mockResolvedValue(existingUser);

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User already exists' });
    });

    it('should handle database errors during registration', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });

    it('should handle user save errors', async () => {
      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        save: jest.fn().mockRejectedValue(new Error('Save error'))
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('loginUser', () => {
    beforeEach(() => {
      req.body = {
        email: faker.internet.email(),
        password: faker.internet.password()
      };
    });

    it('should login user successfully with email', async () => {
      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        id: faker.database.mongodbObjectId(),
        username: faker.internet.username(),
        email: req.body.email,
        profilePicture: faker.image.avatar(),
        bio: faker.lorem.sentence(),
        createdAt: new Date(),
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mock-jwt-token');
      });

      await userController.loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(mockUser.matchPassword).toHaveBeenCalledWith(req.body.password);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          profilePicture: mockUser.profilePicture,
          bio: mockUser.bio,
          createdAt: mockUser.createdAt
        }
      });
    });

    it('should return 400 if user does not exist with username in email field', async () => {
      req.body = {
        email: faker.internet.username(), // Using username in email field
        password: faker.internet.password()
      };

      User.findOne.mockResolvedValue(null); // No user found

      await userController.loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
    });

    it('should return 400 if user does not exist', async () => {
      User.findOne.mockResolvedValue(null);

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
    });

    it('should return 400 if password is incorrect', async () => {
      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        username: faker.internet.username(),
        email: req.body.email,
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await userController.loginUser(req, res);

      expect(mockUser.matchPassword).toHaveBeenCalledWith(req.body.password);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
    });

    it('should handle database errors during login', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getMe', () => {
    it('should return current user data', async () => {
      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        username: faker.internet.username(),
        email: faker.internet.email(),
        bio: faker.lorem.sentence(),
        profilePicture: faker.image.avatar()
      };

      req.user = mockUser;

      await userController.getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle missing user in request', async () => {
      req.user = null;

      await userController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User not found' });
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = {
        id: faker.database.mongodbObjectId()
      };
      req.body = {
        username: faker.internet.username(),
        bio: faker.lorem.sentence(),
        profilePicture: faker.image.avatar()
      };
    });

    it('should update user profile successfully', async () => {
      const updatedUser = {
        _id: req.user.id,
        username: req.body.username,
        bio: req.body.bio,
        profilePicture: req.body.profilePicture,
        email: faker.internet.email()
      };

      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      await userController.updateProfile(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        {
          username: req.body.username,
          bio: req.body.bio,
          profilePicture: req.body.profilePicture
        },
        { new: true, select: '-password' }
      );
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should return 404 if user not found during update', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null);

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User not found' });
    });

    it('should handle database errors during profile update', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });

    it('should only update provided fields', async () => {
      req.body = { bio: faker.lorem.sentence() }; // Only bio provided

      const updatedUser = {
        _id: req.user.id,
        bio: req.body.bio,
        email: faker.internet.email()
      };

      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      await userController.updateProfile(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { bio: req.body.bio },
        { new: true, select: '-password' }
      );
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate JWT with correct payload', async () => {
      const userId = faker.database.mongodbObjectId();
      const mockUser = {
        _id: userId,
        username: faker.internet.username(),
        email: faker.internet.email(),
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = {
        username: mockUser.username,
        email: mockUser.email,
        password: faker.internet.password()
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await userController.registerUser(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });
  });

  describe('Input Validation', () => {
    it('should handle empty request body gracefully', async () => {
      req.body = {};

      User.findOne.mockResolvedValue(null);

      await userController.registerUser(req, res);

      // Should attempt to create user with undefined values
      expect(User).toHaveBeenCalled();
    });

    it('should handle special characters in username', async () => {
      req.body = {
        username: 'test@user#123',
        email: faker.internet.email(),
        password: faker.internet.password()
      };

      const mockUser = {
        _id: faker.database.mongodbObjectId(),
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});