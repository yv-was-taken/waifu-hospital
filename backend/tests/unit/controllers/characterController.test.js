const characterController = require('../../../controllers/characterController');
const Character = require('../../../models/Character');
const User = require('../../../models/User');
const cloudflareImagesService = require('../../../services/cloudflareImagesService');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

// Mock dependencies
jest.mock('../../../models/Character');
jest.mock('../../../models/User');
jest.mock('../../../services/cloudflareImagesService');
jest.mock('axios');

describe('Character Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: faker.database.mongodbObjectId() },
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createCharacter', () => {
    beforeEach(() => {
      req.body = {
        name: faker.person.firstName(),
        imageUrl: faker.image.url(),
        style: 'anime',
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence(),
        background: faker.lorem.paragraph(),
        interests: [faker.music.genre(), faker.music.genre()],
        occupation: faker.person.jobTitle(),
        age: faker.number.int({ min: 18, max: 50 }),
        public: true
      };
    });

    it('should create character successfully', async () => {
      const mockCharacter = {
        _id: faker.database.mongodbObjectId(),
        ...req.body,
        creator: req.user.id,
        save: jest.fn().mockResolvedValue(true)
      };

      Character.mockImplementation(() => mockCharacter);
      cloudflareImagesService.uploadImageFromUrl.mockResolvedValue({
        id: 'cloudflare-id-123'
      });
      cloudflareImagesService.getImageUrl.mockReturnValue('https://cloudflare.url/image.jpg');
      axios.post.mockResolvedValue({
        data: { introMessage: 'Hello! I am a test character.' }
      });
      User.findByIdAndUpdate.mockResolvedValue(true);

      await characterController.createCharacter(req, res);

      expect(Character).toHaveBeenCalledWith(expect.objectContaining({
        name: req.body.name,
        creator: req.user.id,
        imageUrl: req.body.imageUrl,
        style: req.body.style,
        description: req.body.description,
        personality: req.body.personality
      }));
      expect(mockCharacter.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should handle cloudflare upload failure gracefully', async () => {
      const mockCharacter = {
        _id: faker.database.mongodbObjectId(),
        ...req.body,
        creator: req.user.id,
        save: jest.fn().mockResolvedValue(true)
      };

      Character.mockImplementation(() => mockCharacter);
      cloudflareImagesService.uploadImageFromUrl.mockRejectedValue(new Error('Upload failed'));
      axios.post.mockResolvedValue({
        data: { introMessage: 'Hello! I am a test character.' }
      });
      User.findByIdAndUpdate.mockResolvedValue(true);

      await characterController.createCharacter(req, res);

      expect(mockCharacter.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should handle AI service failure for intro message', async () => {
      const mockCharacter = {
        _id: faker.database.mongodbObjectId(),
        ...req.body,
        creator: req.user.id,
        save: jest.fn().mockResolvedValue(true)
      };

      Character.mockImplementation(() => mockCharacter);
      cloudflareImagesService.uploadImageFromUrl.mockResolvedValue({
        id: 'cloudflare-id-123'
      });
      cloudflareImagesService.getImageUrl.mockReturnValue('https://cloudflare.url/image.jpg');
      axios.post.mockRejectedValue(new Error('AI service failed'));
      User.findByIdAndUpdate.mockResolvedValue(true);

      await characterController.createCharacter(req, res);

      expect(mockCharacter.save).toHaveBeenCalled();
      expect(mockCharacter.introMessage).toContain('Hello! I\'m');
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should handle database errors', async () => {
      const mockCharacter = {
        _id: faker.database.mongodbObjectId(),
        ...req.body,
        creator: req.user.id,
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Character.mockImplementation(() => mockCharacter);

      await characterController.createCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getCharacters', () => {
    it('should return public characters', async () => {
      const mockCharacters = [
        {
          _id: faker.database.mongodbObjectId(),
          name: faker.person.firstName(),
          public: true
        },
        {
          _id: faker.database.mongodbObjectId(),
          name: faker.person.firstName(),
          public: true
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockCharacters)
      };

      Character.find.mockReturnValue(mockQuery);

      await characterController.getCharacters(req, res);

      expect(Character.find).toHaveBeenCalledWith({ public: true });
      expect(mockQuery.populate).toHaveBeenCalledWith('creator', ['username', 'profilePicture']);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.json).toHaveBeenCalledWith(mockCharacters);
    });

    it('should handle database errors', async () => {
      Character.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await characterController.getCharacters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getUserCharacters', () => {
    it('should return user\'s characters', async () => {
      const mockCharacters = [
        {
          _id: faker.database.mongodbObjectId(),
          name: faker.person.firstName(),
          creator: req.user.id
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockCharacters)
      };

      Character.find.mockReturnValue(mockQuery);

      await characterController.getUserCharacters(req, res);

      expect(Character.find).toHaveBeenCalledWith({ creator: req.user.id });
      expect(res.json).toHaveBeenCalledWith(mockCharacters);
    });
  });

  describe('getPopularCharacters', () => {
    it('should return popular characters sorted by likes', async () => {
      const mockCharacters = [
        {
          _id: faker.database.mongodbObjectId(),
          name: faker.person.firstName(),
          likes: 100
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCharacters)
      };

      Character.find.mockReturnValue(mockQuery);

      await characterController.getPopularCharacters(req, res);

      expect(Character.find).toHaveBeenCalledWith({ public: true });
      expect(mockQuery.sort).toHaveBeenCalledWith({ likes: -1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(mockCharacters);
    });
  });

  describe('getCharacterById', () => {
    beforeEach(() => {
      req.params.id = faker.database.mongodbObjectId();
    });

    it('should return character by ID', async () => {
      const mockCharacter = {
        _id: req.params.id,
        name: faker.person.firstName(),
        public: true,
        creator: { _id: faker.database.mongodbObjectId() },
        cloudflareImageId: null,
        imageUrl: faker.image.url(),
        save: jest.fn()
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockCharacter)
      };

      Character.findById.mockReturnValue(mockQuery);

      await characterController.getCharacterById(req, res);

      expect(Character.findById).toHaveBeenCalledWith(req.params.id);
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should return 404 if character not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null)
      };

      Character.findById.mockReturnValue(mockQuery);

      await characterController.getCharacterById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });

    it('should return 403 if character is private and not owned by user', async () => {
      const mockCharacter = {
        _id: req.params.id,
        name: faker.person.firstName(),
        public: false,
        creator: { _id: faker.database.mongodbObjectId() }
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockCharacter)
      };

      Character.findById.mockReturnValue(mockQuery);

      await characterController.getCharacterById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'This character is private' });
    });

    it('should update cloudflare image URL if needed', async () => {
      const mockCharacter = {
        _id: req.params.id,
        name: faker.person.firstName(),
        public: true,
        creator: { _id: faker.database.mongodbObjectId() },
        cloudflareImageId: 'cloudflare-id-123',
        imageUrl: 'old-url.com/image.jpg',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockCharacter)
      };

      Character.findById.mockReturnValue(mockQuery);
      cloudflareImagesService.getImageUrl.mockReturnValue('https://imagedelivery.net/cloudflare-id-123/public');

      await characterController.getCharacterById(req, res);

      expect(cloudflareImagesService.getImageUrl).toHaveBeenCalledWith('cloudflare-id-123');
      expect(mockCharacter.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should handle invalid ObjectId', async () => {
      const error = new Error('Invalid ObjectId');
      error.kind = 'ObjectId';

      Character.findById.mockImplementation(() => {
        throw error;
      });

      await characterController.getCharacterById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });
  });

  describe('updateCharacter', () => {
    beforeEach(() => {
      req.params.id = faker.database.mongodbObjectId();
      req.body = {
        name: faker.person.firstName(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      };
    });

    it('should update character successfully', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: req.user.id,
        personality: 'old personality'
      };

      const updatedCharacter = {
        ...mockCharacter,
        ...req.body,
        save: jest.fn().mockResolvedValue(true)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Character.findByIdAndUpdate.mockResolvedValue(updatedCharacter);
      axios.post.mockResolvedValue({
        data: { introMessage: 'Updated intro message' }
      });

      await characterController.updateCharacter(req, res);

      expect(Character.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.id,
        { $set: expect.objectContaining(req.body) },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedCharacter);
    });

    it('should return 404 if character not found', async () => {
      Character.findById.mockResolvedValue(null);

      await characterController.updateCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });

    it('should return 401 if user not authorized', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: faker.database.mongodbObjectId() // Different user
      };

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.updateCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Not authorized to update this character' });
    });

    it('should regenerate intro message if personality changed', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: req.user.id,
        personality: 'old personality'
      };

      const updatedCharacter = {
        ...mockCharacter,
        ...req.body,
        save: jest.fn().mockResolvedValue(true)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Character.findByIdAndUpdate.mockResolvedValue(updatedCharacter);
      axios.post.mockResolvedValue({
        data: { introMessage: 'New intro based on personality' }
      });

      await characterController.updateCharacter(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate-intro'),
        expect.objectContaining({
          character: expect.objectContaining({
            personality: req.body.personality
          })
        })
      );
    });
  });

  describe('deleteCharacter', () => {
    beforeEach(() => {
      req.params.id = faker.database.mongodbObjectId();
    });

    it('should delete character successfully', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: req.user.id,
        cloudflareImageId: 'cloudflare-id-123'
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Character.deleteOne.mockResolvedValue(true);
      cloudflareImagesService.deleteImage.mockResolvedValue(true);
      User.findByIdAndUpdate.mockResolvedValue(true);

      await characterController.deleteCharacter(req, res);

      expect(cloudflareImagesService.deleteImage).toHaveBeenCalledWith('cloudflare-id-123');
      expect(Character.deleteOne).toHaveBeenCalledWith({ _id: req.params.id });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user.id,
        { $pull: { characters: req.params.id } }
      );
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character deleted' });
    });

    it('should return 404 if character not found', async () => {
      Character.findById.mockResolvedValue(null);

      await characterController.deleteCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });

    it('should return 401 if user not authorized', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: faker.database.mongodbObjectId() // Different user
      };

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.deleteCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Not authorized to delete this character' });
    });

    it('should handle cloudflare delete errors gracefully', async () => {
      const mockCharacter = {
        _id: req.params.id,
        creator: req.user.id,
        cloudflareImageId: 'cloudflare-id-123'
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Character.deleteOne.mockResolvedValue(true);
      cloudflareImagesService.deleteImage.mockRejectedValue(new Error('Delete failed'));
      User.findByIdAndUpdate.mockResolvedValue(true);

      await characterController.deleteCharacter(req, res);

      expect(Character.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character deleted' });
    });
  });

  describe('likeCharacter', () => {
    beforeEach(() => {
      req.params.id = faker.database.mongodbObjectId();
    });

    it('should like character successfully', async () => {
      const mockCharacter = {
        _id: req.params.id,
        likedBy: [],
        likes: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      mockCharacter.likedBy.some = jest.fn().mockReturnValue(false);
      mockCharacter.likedBy.unshift = jest.fn();

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.likeCharacter(req, res);

      expect(mockCharacter.likedBy.unshift).toHaveBeenCalledWith(req.user.id);
      expect(mockCharacter.likes).toBe(1);
      expect(mockCharacter.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should return 400 if already liked', async () => {
      const mockCharacter = {
        _id: req.params.id,
        likedBy: [req.user.id],
        likes: 1
      };

      mockCharacter.likedBy.some = jest.fn().mockReturnValue(true);

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.likeCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character already liked' });
    });

    it('should return 404 if character not found', async () => {
      Character.findById.mockResolvedValue(null);

      await characterController.likeCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });
  });

  describe('unlikeCharacter', () => {
    beforeEach(() => {
      req.params.id = faker.database.mongodbObjectId();
    });

    it('should unlike character successfully', async () => {
      const mockCharacter = {
        _id: req.params.id,
        likedBy: [req.user.id],
        likes: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      mockCharacter.likedBy.some = jest.fn().mockReturnValue(true);
      mockCharacter.likedBy.filter = jest.fn().mockReturnValue([]);

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.unlikeCharacter(req, res);

      expect(mockCharacter.likes).toBe(0);
      expect(mockCharacter.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCharacter);
    });

    it('should return 400 if not yet liked', async () => {
      const mockCharacter = {
        _id: req.params.id,
        likedBy: [],
        likes: 0
      };

      mockCharacter.likedBy.some = jest.fn().mockReturnValue(false);

      Character.findById.mockResolvedValue(mockCharacter);

      await characterController.unlikeCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character has not yet been liked' });
    });
  });
});