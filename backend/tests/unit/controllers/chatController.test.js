const chatController = require('../../../controllers/chatController');
const Chat = require('../../../models/Chat');
const Character = require('../../../models/Character');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

// Mock dependencies
jest.mock('../../../models/Chat');
jest.mock('../../../models/Character');
jest.mock('axios');

describe('Chat Controller', () => {
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

  describe('getUserChats', () => {
    it('should return user chats sorted by last message timestamp', async () => {
      const mockChats = [
        {
          _id: faker.database.mongodbObjectId(),
          user: req.user.id,
          character: faker.database.mongodbObjectId(),
          lastMessageTimestamp: new Date()
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockChats)
      };

      Chat.find.mockReturnValue(mockQuery);

      await chatController.getUserChats(req, res);

      expect(Chat.find).toHaveBeenCalledWith({ user: req.user.id });
      expect(mockQuery.populate).toHaveBeenCalledWith('character', ['name', 'imageUrl', 'personality']);
      expect(mockQuery.sort).toHaveBeenCalledWith({ lastMessageTimestamp: -1 });
      expect(res.json).toHaveBeenCalledWith(mockChats);
    });

    it('should handle database errors', async () => {
      Chat.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await chatController.getUserChats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getChatWithCharacter', () => {
    beforeEach(() => {
      req.params.characterId = faker.database.mongodbObjectId();
    });

    it('should return existing chat with character', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        introMessage: 'Hello! I am a test character.'
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        user: req.user.id,
        character: req.params.characterId,
        messages: []
      };

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockReturnValue(mockPopulatedQuery);

      await chatController.getChatWithCharacter(req, res);

      expect(Character.findById).toHaveBeenCalledWith(req.params.characterId);
      expect(Chat.findOne).toHaveBeenCalledWith({
        user: req.user.id,
        character: req.params.characterId
      });
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    it('should create new chat if none exists', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        introMessage: 'Hello! I am a test character.'
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock message push method
      mockChat.messages.push = jest.fn();

      const mockPopulatedQueryExisting = {
        populate: jest.fn().mockResolvedValue(null)
      };

      const mockPopulatedQueryNew = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockReturnValue(mockPopulatedQueryExisting);
      Chat.mockImplementation(() => mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQueryNew);

      await chatController.getChatWithCharacter(req, res);

      expect(Chat).toHaveBeenCalledWith({
        user: req.user.id,
        character: req.params.characterId,
        messages: []
      });
      expect(mockChat.messages.push).toHaveBeenCalledWith({
        sender: 'character',
        content: 'Hello! I am a test character.'
      });
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    it('should return 404 if character not found', async () => {
      Character.findById.mockResolvedValue(null);

      await chatController.getChatWithCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });

    it('should handle invalid ObjectId', async () => {
      const error = new Error('Invalid ObjectId');
      error.kind = 'ObjectId';

      Character.findById.mockRejectedValue(error);

      await chatController.getChatWithCharacter(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      req.params.characterId = faker.database.mongodbObjectId();
      req.body.message = faker.lorem.sentence();
    });

    it('should send message to existing chat', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        personality: faker.lorem.sentence(),
        background: faker.lorem.paragraph(),
        interests: [faker.music.genre()],
        occupation: faker.person.jobTitle()
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock message push method
      mockChat.messages.push = jest.fn();

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockResolvedValue(mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQuery);
      
      // Mock AI service response
      axios.post.mockResolvedValue({
        data: { reply: 'This is an AI response.' }
      });

      await chatController.sendMessage(req, res);

      expect(mockChat.messages.push).toHaveBeenCalledTimes(2); // User message + AI response
      expect(mockChat.messages.push).toHaveBeenNthCalledWith(1, {
        sender: 'user',
        content: req.body.message
      });
      expect(mockChat.messages.push).toHaveBeenNthCalledWith(2, {
        sender: 'character',
        content: 'This is an AI response.'
      });
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    it('should create new chat if none exists', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        personality: faker.lorem.sentence(),
        introMessage: 'Hello! I am new.'
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock message push method
      mockChat.messages.push = jest.fn();

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockResolvedValue(null);
      Chat.mockImplementation(() => mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQuery);
      
      // Mock AI service response
      axios.post.mockResolvedValue({
        data: { reply: 'This is an AI response.' }
      });

      await chatController.sendMessage(req, res);

      expect(Chat).toHaveBeenCalledWith({
        user: req.user.id,
        character: req.params.characterId,
        messages: []
      });
      expect(mockChat.messages.push).toHaveBeenCalledWith({
        sender: 'character',
        content: 'Hello! I am new.'
      });
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    it('should use fallback response if AI service fails', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        personality: faker.lorem.sentence()
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        user: req.user.id,
        character: req.params.characterId,
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockChat.messages.push = jest.fn();

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockResolvedValue(mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQuery);
      
      // Mock AI service failure
      axios.post.mockRejectedValue(new Error('AI service failed'));

      await chatController.sendMessage(req, res);

      expect(mockChat.messages.push).toHaveBeenCalledTimes(2);
      expect(mockChat.messages.push).toHaveBeenNthCalledWith(2, {
        sender: 'character',
        content: expect.stringContaining('Hi there! I\'m')
      });
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });

    it('should return 404 if character not found', async () => {
      Character.findById.mockResolvedValue(null);

      await chatController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Character not found' });
    });

    it('should handle validation errors', async () => {
      // Mock express-validator to return errors
      const mockValidationResult = require('express-validator');
      mockValidationResult.validationResult = jest.fn().mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Message is required' }]
      });

      req.body.message = ''; // Empty message

      await chatController.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ msg: 'Message is required' }]
      });
    });
  });

  describe('deleteChat', () => {
    beforeEach(() => {
      req.params.chatId = faker.database.mongodbObjectId();
    });

    it('should delete chat successfully', async () => {
      const mockChat = {
        _id: req.params.chatId,
        user: req.user.id,
        remove: jest.fn().mockResolvedValue(true)
      };

      Chat.findById.mockResolvedValue(mockChat);

      await chatController.deleteChat(req, res);

      expect(Chat.findById).toHaveBeenCalledWith(req.params.chatId);
      expect(mockChat.remove).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: 'Chat deleted' });
    });

    it('should return 404 if chat not found', async () => {
      Chat.findById.mockResolvedValue(null);

      await chatController.deleteChat(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Chat not found' });
    });

    it('should return 401 if user not authorized', async () => {
      const mockChat = {
        _id: req.params.chatId,
        user: faker.database.mongodbObjectId() // Different user
      };

      Chat.findById.mockResolvedValue(mockChat);

      await chatController.deleteChat(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Not authorized to delete this chat' });
    });

    it('should handle invalid ObjectId', async () => {
      const error = new Error('Invalid ObjectId');
      error.kind = 'ObjectId';

      Chat.findById.mockRejectedValue(error);

      await chatController.deleteChat(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Chat not found' });
    });
  });

  describe('getCharacterReply', () => {
    // This is a private function, tested indirectly through sendMessage
    it('should call AI service with character data', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        personality: faker.lorem.sentence(),
        background: faker.lorem.paragraph(),
        interests: [faker.music.genre()],
        occupation: faker.person.jobTitle()
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockChat.messages.push = jest.fn();

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      req.params.characterId = mockCharacter._id;
      req.body.message = 'Test message';

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockResolvedValue(mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQuery);
      
      axios.post.mockResolvedValue({
        data: { reply: 'AI response' }
      });

      await chatController.sendMessage(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({
          character: expect.objectContaining({
            name: mockCharacter.name,
            personality: mockCharacter.personality,
            background: mockCharacter.background,
            interests: mockCharacter.interests,
            occupation: mockCharacter.occupation
          }),
          messages: expect.any(Array)
        })
      );
    });

    it('should use fallback responses when AI service unavailable', async () => {
      const mockCharacter = {
        _id: req.params.characterId,
        name: faker.person.firstName(),
        personality: faker.lorem.sentence()
      };

      const mockChat = {
        _id: faker.database.mongodbObjectId(),
        messages: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockChat.messages.push = jest.fn();

      const mockPopulatedQuery = {
        populate: jest.fn().mockResolvedValue(mockChat)
      };

      req.params.characterId = mockCharacter._id;
      req.body.message = 'Test message';

      Character.findById.mockResolvedValue(mockCharacter);
      Chat.findOne.mockResolvedValue(mockChat);
      Chat.findById.mockReturnValue(mockPopulatedQuery);
      
      // No AI service URL
      process.env.AI_SERVICE_URL = '';

      await chatController.sendMessage(req, res);

      expect(mockChat.messages.push).toHaveBeenNthCalledWith(2, {
        sender: 'character',
        content: expect.stringContaining('Hi there! I\'m')
      });
    });
  });
});