const authMiddleware = require('../../../middleware/authMiddleware');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

// Mock the User model
jest.mock('../../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should return 401 if no token is provided', async () => {
      req.header.mockReturnValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.header.mockReturnValue('invalid-token');

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not found', async () => {
      const userId = faker.database.mongodbObjectId();
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and set req.user if token is valid', async () => {
      const userId = faker.database.mongodbObjectId();
      const mockUser = {
        _id: userId,
        username: faker.internet.username(),
        email: faker.internet.email()
      };
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authMiddleware(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should extract token from x-auth-token header', async () => {
      const userId = faker.database.mongodbObjectId();
      const mockUser = {
        _id: userId,
        username: faker.internet.username(),
        email: faker.internet.email()
      };
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authMiddleware(req, res, next);

      expect(req.header).toHaveBeenCalledWith('x-auth-token');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const userId = faker.database.mongodbObjectId();
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed JWT tokens', async () => {
      req.header.mockReturnValue('malformed.jwt.token');

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired JWT tokens', async () => {
      const userId = faker.database.mongodbObjectId();
      const expiredToken = jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Expired immediately
      );
      
      req.header.mockReturnValue(expiredToken);

      // Wait a small amount to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 10));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('User Selection', () => {
    it('should exclude password from user selection', async () => {
      const userId = faker.database.mongodbObjectId();
      const mockUser = {
        _id: userId,
        username: faker.internet.username(),
        email: faker.internet.email()
      };
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ select: selectMock });

      await authMiddleware(req, res, next);

      expect(selectMock).toHaveBeenCalledWith('-password');
    });
  });

  describe('Multiple Token Scenarios', () => {
    it('should handle empty string token', async () => {
      req.header.mockReturnValue('');

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle undefined token', async () => {
      req.header.mockReturnValue(undefined);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with different JWT secrets in test environment', async () => {
      const userId = faker.database.mongodbObjectId();
      const mockUser = {
        _id: userId,
        username: faker.internet.username(),
        email: faker.internet.email()
      };
      
      // Use the test JWT secret
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
      
      req.header.mockReturnValue(token);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });
});