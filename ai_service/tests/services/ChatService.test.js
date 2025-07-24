const { faker } = require('@faker-js/faker');

// Mock dependencies - must be declared before imports
const mockChatCreate = jest.fn();
jest.mock('axios');
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCreate
      }
    }
  }))
}));

const ChatService = require('../../services/ChatService');
const { getCharacterById, Character, setCharacters } = require('../../models/Character');
const axios = require('axios');

// Mock Character model functions
jest.mock('../../models/Character', () => ({
  getCharacterById: jest.fn(),
  Character: jest.fn(),
  setCharacters: jest.fn()
}));

describe('ChatService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.OPENAI_CHAT_API_KEY = 'test-api-key';
    process.env.BACKEND_URL = 'http://test-backend:5000';
  });

  describe('generateResponse', () => {
    const characterId = faker.database.mongodbObjectId();
    const userMessage = faker.lorem.sentence();
    
    const mockCharacter = {
      id: characterId,
      name: faker.person.firstName(),
      personality: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      interests: [faker.music.genre(), faker.music.genre()],
      background: faker.lorem.paragraph(),
      occupation: faker.person.jobTitle(),
      age: faker.number.int({ min: 18, max: 50 }),
      greedFactor: faker.number.int({ min: 0, max: 5 }),
      getSystemPrompt: jest.fn(() => 'System prompt for character')
    };

    it('should generate response for cached character', async () => {
      const aiResponse = faker.lorem.sentences(3);
      const systemPrompt = 'System prompt for character';
      
      // Set up the mock to return the system prompt
      mockCharacter.getSystemPrompt.mockReturnValue(systemPrompt);
      getCharacterById.mockReturnValue(mockCharacter);
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: aiResponse } }]
      });

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(getCharacterById).toHaveBeenCalledWith(characterId);
      expect(mockCharacter.getSystemPrompt).toHaveBeenCalled();
      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      expect(result).toBe(aiResponse);
    });

    it('should fetch character from backend if not cached', async () => {
      const aiResponse = faker.lorem.sentences(3);
      const backendCharacterData = {
        _id: characterId,
        name: mockCharacter.name,
        personality: mockCharacter.personality,
        description: mockCharacter.description,
        interests: mockCharacter.interests,
        background: mockCharacter.background,
        occupation: mockCharacter.occupation,
        age: mockCharacter.age,
        greedFactor: mockCharacter.greedFactor
      };

      getCharacterById.mockReturnValue(null);
      axios.get.mockResolvedValue({ data: backendCharacterData });
      Character.mockImplementation(() => mockCharacter);
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: aiResponse } }]
      });

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(getCharacterById).toHaveBeenCalledWith(characterId);
      expect(axios.get).toHaveBeenCalledWith(`http://test-backend:5000/api/characters/${characterId}`);
      expect(Character).toHaveBeenCalledWith(
        backendCharacterData._id,
        backendCharacterData.name,
        backendCharacterData.personality,
        backendCharacterData.description,
        backendCharacterData.interests,
        backendCharacterData.background,
        backendCharacterData.occupation,
        backendCharacterData.age,
        backendCharacterData.greedFactor
      );
      expect(result).toBe(aiResponse);
    });

    it('should throw error if character not found in cache or backend', async () => {
      getCharacterById.mockReturnValue(null);
      axios.get.mockRejectedValue(new Error('Character not found'));

      await expect(ChatService.generateResponse(characterId, userMessage))
        .rejects.toThrow(`Character with ID ${characterId} not found`);
    });

    it('should throw error if character fetch returns null', async () => {
      getCharacterById.mockReturnValue(null);
      axios.get.mockResolvedValue({ data: null });

      await expect(ChatService.generateResponse(characterId, userMessage))
        .rejects.toThrow(`Character with ID ${characterId} not found after fetch attempt`);
    });

    it('should return null if OpenAI API key is missing', async () => {
      delete process.env.OPENAI_CHAT_API_KEY;
      getCharacterById.mockReturnValue(mockCharacter);

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(result).toBeNull();
    });

    it('should return null on OpenAI API error', async () => {
      getCharacterById.mockReturnValue(mockCharacter);
      mockChatCreate.mockRejectedValue(new Error('API Error'));

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(result).toBeNull();
    });

    it('should handle OpenAI authentication errors', async () => {
      const authError = new Error('Authentication failed');
      authError.message = 'auth error';
      
      getCharacterById.mockReturnValue(mockCharacter);
      mockChatCreate.mockRejectedValue(authError);

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(result).toBeNull();
    });

    it('should handle OpenAI response errors', async () => {
      const responseError = new Error('Bad Request');
      responseError.response = {
        status: 400,
        data: { error: 'Invalid request' }
      };
      
      getCharacterById.mockReturnValue(mockCharacter);
      mockChatCreate.mockRejectedValue(responseError);

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(result).toBeNull();
    });

    it('should use default backend URL if not set', async () => {
      delete process.env.BACKEND_URL;
      const aiResponse = faker.lorem.sentences(3);
      const backendCharacterData = {
        _id: characterId,
        name: mockCharacter.name,
        personality: mockCharacter.personality,
        description: mockCharacter.description
      };

      getCharacterById.mockReturnValue(null);
      axios.get.mockResolvedValue({ data: backendCharacterData });
      Character.mockImplementation(() => mockCharacter);
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: aiResponse } }]
      });

      await ChatService.generateResponse(characterId, userMessage);

      expect(axios.get).toHaveBeenCalledWith(`http://backend:5000/api/characters/${characterId}`);
    });
  });

  describe('generateIntroMessage', () => {
    const mockCharacter = {
      name: faker.person.firstName(),
      personality: faker.lorem.sentence(),
      background: faker.lorem.paragraph(),
      occupation: faker.person.jobTitle(),
      interests: [faker.music.genre(), faker.music.genre()]
    };

    it('should generate intro message successfully', async () => {
      const introMessage = faker.lorem.sentences(2);
      
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: introMessage } }]
      });

      const result = await ChatService.generateIntroMessage(mockCharacter);

      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining(`You are ${mockCharacter.name}`)
          },
          {
            role: 'user',
            content: 'Generate an introductory message for when someone starts chatting with you for the first time.'
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });
      expect(result).toBe(introMessage);
    });

    it('should include all character details in system prompt', async () => {
      const introMessage = faker.lorem.sentences(2);
      
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: introMessage } }]
      });

      await ChatService.generateIntroMessage(mockCharacter);

      const systemPromptCall = mockChatCreate.mock.calls[0][0];
      const systemPrompt = systemPromptCall.messages[0].content;

      expect(systemPrompt).toContain(mockCharacter.name);
      expect(systemPrompt).toContain(mockCharacter.personality);
      expect(systemPrompt).toContain(mockCharacter.background);
      expect(systemPrompt).toContain(mockCharacter.occupation);
      expect(systemPrompt).toContain(mockCharacter.interests.join(', '));
    });

    it('should handle character with minimal data', async () => {
      const minimalCharacter = {
        name: faker.person.firstName(),
        personality: faker.lorem.sentence()
      };
      const introMessage = faker.lorem.sentences(2);
      
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: introMessage } }]
      });

      const result = await ChatService.generateIntroMessage(minimalCharacter);

      expect(result).toBe(introMessage);
    });

    it('should return null if API key is missing', async () => {
      delete process.env.OPENAI_CHAT_API_KEY;

      const result = await ChatService.generateIntroMessage(mockCharacter);

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      mockChatCreate.mockRejectedValue(new Error('API Error'));

      const result = await ChatService.generateIntroMessage(mockCharacter);

      expect(result).toBeNull();
    });

    it('should handle empty interests array', async () => {
      const characterWithoutInterests = {
        ...mockCharacter,
        interests: []
      };
      const introMessage = faker.lorem.sentences(2);
      
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: introMessage } }]
      });

      await ChatService.generateIntroMessage(characterWithoutInterests);

      const systemPromptCall = mockChatCreate.mock.calls[0][0];
      const systemPrompt = systemPromptCall.messages[0].content;
      
      expect(systemPrompt).not.toContain('Interests:');
    });
  });

  describe('getFallbackResponse', () => {
    const characterId = faker.database.mongodbObjectId();

    it('should return character-specific fallback when character exists', () => {
      const mockCharacter = {
        name: faker.person.firstName(),
        personality: faker.lorem.words(3),
        occupation: faker.person.jobTitle(),
        interests: [faker.music.genre(), faker.music.genre()]
      };

      getCharacterById.mockReturnValue(mockCharacter);

      const result = ChatService.getFallbackResponse(characterId);

      expect(getCharacterById).toHaveBeenCalledWith(characterId);
      expect(result).toContain(mockCharacter.name);
      expect(result).toContain(mockCharacter.occupation);
      expect(result).toContain(mockCharacter.personality);
      expect(result).toContain(mockCharacter.interests.join(', '));
    });

    it('should handle character without optional fields', () => {
      const mockCharacter = {
        name: faker.person.firstName(),
        personality: faker.lorem.words(3)
      };

      getCharacterById.mockReturnValue(mockCharacter);

      const result = ChatService.getFallbackResponse(characterId);

      expect(result).toContain(mockCharacter.name);
      expect(result).toContain(mockCharacter.personality);
    });

    it('should return generic fallback when character not found', () => {
      getCharacterById.mockReturnValue(null);

      const result = ChatService.getFallbackResponse(characterId);

      expect(result).toMatch(/Hi there!|Hello!|Hey!|Hi!|Hello there!/);
      expect(result).toMatch(/chat|conversation|talk|meet|know/);
    });

    it('should return different generic responses on multiple calls', () => {
      getCharacterById.mockReturnValue(null);

      const responses = new Set();
      for (let i = 0; i < 20; i++) {
        responses.add(ChatService.getFallbackResponse(characterId));
      }

      // Should have multiple different responses due to randomization
      expect(responses.size).toBeGreaterThan(1);
    });

    it('should handle character with empty interests array', () => {
      const mockCharacter = {
        name: faker.person.firstName(),
        personality: faker.lorem.words(3),
        occupation: faker.person.jobTitle(),
        interests: []
      };

      getCharacterById.mockReturnValue(mockCharacter);

      const result = ChatService.getFallbackResponse(characterId);

      expect(result).toContain(mockCharacter.name);
      expect(result).not.toContain('interested in');
    });

    it('should handle character with null occupation', () => {
      const mockCharacter = {
        name: faker.person.firstName(),
        personality: faker.lorem.words(3),
        occupation: null,
        interests: [faker.music.genre()]
      };

      getCharacterById.mockReturnValue(mockCharacter);

      const result = ChatService.getFallbackResponse(characterId);

      expect(result).toContain(mockCharacter.name);
      expect(result).not.toContain('null');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const characterId = faker.database.mongodbObjectId();
      const userMessage = faker.lorem.sentence();
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ECONNABORTED';
      
      getCharacterById.mockReturnValue(null);
      axios.get.mockRejectedValue(timeoutError);

      await expect(ChatService.generateResponse(characterId, userMessage))
        .rejects.toThrow(`Character with ID ${characterId} not found`);
    });

    it('should handle malformed backend responses', async () => {
      const characterId = faker.database.mongodbObjectId();
      const userMessage = faker.lorem.sentence();
      
      getCharacterById.mockReturnValue(null);
      axios.get.mockResolvedValue({ data: null }); // This will cause character to be null

      await expect(ChatService.generateResponse(characterId, userMessage))
        .rejects.toThrow(`Character with ID ${characterId} not found after fetch attempt`);
    });

    it('should handle OpenAI rate limiting', async () => {
      const characterId = faker.database.mongodbObjectId();
      const userMessage = faker.lorem.sentence();
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' }
      };
      
      const mockCharacter = {
        getSystemPrompt: jest.fn().mockReturnValue('System prompt')
      };
      
      getCharacterById.mockReturnValue(mockCharacter);
      mockChatCreate.mockRejectedValue(rateLimitError);

      const result = await ChatService.generateResponse(characterId, userMessage);

      expect(result).toBeNull();
    });
  });
});