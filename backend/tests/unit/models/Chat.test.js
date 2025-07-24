const Chat = require('../../../models/Chat');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

describe('Chat Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid chat with required fields', async () => {
      const chatData = {
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: []
      };

      const chat = new Chat(chatData);
      const savedChat = await chat.save();

      expect(savedChat._id).toBeDefined();
      expect(savedChat.user).toEqual(chatData.user);
      expect(savedChat.character).toEqual(chatData.character);
      expect(savedChat.messages).toEqual([]);
      expect(savedChat.lastMessageTimestamp).toBeDefined();
      expect(savedChat.createdAt).toBeDefined();
    });

    it('should require user', async () => {
      const chat = new Chat({
        character: new mongoose.Types.ObjectId(),
        messages: []
      });

      await expect(chat.save()).rejects.toThrow();
    });

    it('should require character', async () => {
      const chat = new Chat({
        user: new mongoose.Types.ObjectId(),
        messages: []
      });

      await expect(chat.save()).rejects.toThrow();
    });

    it('should create chat without messages array (uses default)', async () => {
      const chat = new Chat({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId()
      });

      const savedChat = await chat.save();
      expect(savedChat.messages).toEqual([]);
    });
  });

  describe('Messages', () => {
    it('should save messages with valid structure', async () => {
      const messages = [
        {
          sender: 'user',
          content: faker.lorem.sentence()
        },
        {
          sender: 'character',
          content: faker.lorem.sentence()
        }
      ];

      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages
      });

      expect(chat.messages).toHaveLength(2);
      expect(chat.messages[0].sender).toBe('user');
      expect(chat.messages[0].content).toBe(messages[0].content);
      expect(chat.messages[0].timestamp).toBeDefined();
      expect(chat.messages[0]._id).toBeDefined();

      expect(chat.messages[1].sender).toBe('character');
      expect(chat.messages[1].content).toBe(messages[1].content);
      expect(chat.messages[1].timestamp).toBeDefined();
      expect(chat.messages[1]._id).toBeDefined();
    });

    it('should validate sender enum values', async () => {
      const chat = new Chat({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [
          {
            sender: 'invalid-sender',
            content: faker.lorem.sentence()
          }
        ]
      });

      await expect(chat.save()).rejects.toThrow();
    });

    it('should require message content', async () => {
      const chat = new Chat({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [
          {
            sender: 'user'
            // missing content
          }
        ]
      });

      await expect(chat.save()).rejects.toThrow();
    });

    it('should require message sender', async () => {
      const chat = new Chat({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [
          {
            // missing sender
            content: faker.lorem.sentence()
          }
        ]
      });

      await expect(chat.save()).rejects.toThrow();
    });

    it('should auto-generate message timestamps', async () => {
      const before = new Date();
      
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [
          {
            sender: 'user',
            content: faker.lorem.sentence()
          }
        ]
      });
      
      const after = new Date();

      const messageTimestamp = chat.messages[0].timestamp;
      expect(messageTimestamp).toBeDefined();
      expect(messageTimestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(messageTimestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should allow adding messages to existing chat', async () => {
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: []
      });

      chat.messages.push({
        sender: 'user',
        content: faker.lorem.sentence()
      });

      chat.messages.push({
        sender: 'character',
        content: faker.lorem.sentence()
      });

      const savedChat = await chat.save();
      expect(savedChat.messages).toHaveLength(2);
    });
  });

  describe('Last Message Timestamp', () => {
    it('should set default lastMessageTimestamp to creation time', async () => {
      const before = new Date();
      
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId()
      });
      
      const after = new Date();

      expect(chat.lastMessageTimestamp).toBeDefined();
      expect(chat.lastMessageTimestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(chat.lastMessageTimestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should update lastMessageTimestamp manually', async () => {
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId()
      });

      const newTimestamp = new Date();
      chat.lastMessageTimestamp = newTimestamp;
      await chat.save();

      const foundChat = await Chat.findById(chat._id);
      expect(foundChat.lastMessageTimestamp.getTime()).toBe(newTimestamp.getTime());
    });
  });

  describe('Relationships', () => {
    it('should reference user and character', async () => {
      const userId = new mongoose.Types.ObjectId();
      const characterId = new mongoose.Types.ObjectId();

      const chat = await Chat.create({
        user: userId,
        character: characterId
      });

      expect(chat.user.toString()).toBe(userId.toString());
      expect(chat.character.toString()).toBe(characterId.toString());
    });
  });

  describe('Complex Message Scenarios', () => {
    it('should handle long conversation history', async () => {
      const messages = [];
      for (let i = 0; i < 100; i++) {
        messages.push({
          sender: i % 2 === 0 ? 'user' : 'character',
          content: faker.lorem.sentence()
        });
      }

      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages
      });

      expect(chat.messages).toHaveLength(100);
    });

    it('should handle messages with special characters', async () => {
      const specialContent = '😀 Hello! <script>alert("test")</script> & special chars: " \' \\ /';
      
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [{
          sender: 'user',
          content: specialContent
        }]
      });

      expect(chat.messages[0].content).toBe(specialContent);
    });

    it('should handle very long message content', async () => {
      const longContent = faker.lorem.paragraphs(50);
      
      const chat = await Chat.create({
        user: new mongoose.Types.ObjectId(),
        character: new mongoose.Types.ObjectId(),
        messages: [{
          sender: 'user',
          content: longContent
        }]
      });

      expect(chat.messages[0].content).toBe(longContent);
    });
  });
});