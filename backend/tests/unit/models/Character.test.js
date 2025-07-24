const Character = require('../../../models/Character');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

describe('Character Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid character with all required fields', async () => {
      const characterData = {
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      };

      const character = new Character(characterData);
      const savedCharacter = await character.save();

      expect(savedCharacter._id).toBeDefined();
      expect(savedCharacter.name).toBe(characterData.name);
      expect(savedCharacter.creator).toEqual(characterData.creator);
      expect(savedCharacter.imageUrl).toBe(characterData.imageUrl);
      expect(savedCharacter.description).toBe(characterData.description);
      expect(savedCharacter.personality).toBe(characterData.personality);
      expect(savedCharacter.style).toBe('anime'); // default
      expect(savedCharacter.public).toBe(true); // default
      expect(savedCharacter.likes).toBe(0); // default
      expect(savedCharacter.likedBy).toEqual([]); // default
      expect(savedCharacter.cloudflareImageId).toBe(''); // default
      expect(savedCharacter.greedFactor).toBe(0); // default
      expect(savedCharacter.introMessage).toBe(''); // default
      expect(savedCharacter.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      const character = new Character({
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should require creator', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should require imageUrl', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should require description', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        personality: faker.lorem.sentence()
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should require personality', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph()
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should trim name', async () => {
      const character = new Character({
        name: '  TestCharacter  ',
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      const savedCharacter = await character.save();
      expect(savedCharacter.name).toBe('TestCharacter');
    });

    it('should validate style enum values', async () => {
      const validStyles = [
        'retro', 'gothic', 'neocyber', 'anime', 
        'realistic', 'fantasy', 'sci-fi', 'chibi'
      ];

      for (const style of validStyles) {
        const character = new Character({
          name: faker.person.firstName(),
          creator: new mongoose.Types.ObjectId(),
          imageUrl: faker.image.url(),
          description: faker.lorem.paragraph(),
          personality: faker.lorem.sentence(),
          style
        });

        const savedCharacter = await character.save();
        expect(savedCharacter.style).toBe(style);
      }
    });

    it('should reject invalid style values', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence(),
        style: 'invalid-style'
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should validate age minimum value', async () => {
      const character = new Character({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence(),
        age: -1
      });

      await expect(character.save()).rejects.toThrow();
    });

    it('should validate greedFactor range', async () => {
      // Test valid range
      for (let i = 0; i <= 5; i++) {
        const character = new Character({
          name: faker.person.firstName(),
          creator: new mongoose.Types.ObjectId(),
          imageUrl: faker.image.url(),
          description: faker.lorem.paragraph(),
          personality: faker.lorem.sentence(),
          greedFactor: i
        });

        const savedCharacter = await character.save();
        expect(savedCharacter.greedFactor).toBe(i);
      }

      // Test invalid values
      const invalidValues = [-1, 6, 10];
      for (const value of invalidValues) {
        const character = new Character({
          name: faker.person.firstName(),
          creator: new mongoose.Types.ObjectId(),
          imageUrl: faker.image.url(),
          description: faker.lorem.paragraph(),
          personality: faker.lorem.sentence(),
          greedFactor: value
        });

        await expect(character.save()).rejects.toThrow();
      }
    });
  });

  describe('Optional Fields', () => {
    it('should save all optional fields', async () => {
      const characterData = {
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence(),
        background: faker.lorem.paragraphs(2),
        interests: [faker.music.genre(), faker.music.genre(), faker.music.genre()],
        occupation: faker.person.jobTitle(),
        age: faker.number.int({ min: 18, max: 50 }),
        cloudflareImageId: faker.string.uuid(),
        introMessage: faker.lorem.sentence(),
        greedFactor: faker.number.int({ min: 0, max: 5 }),
        public: false
      };

      const character = await Character.create(characterData);

      expect(character.background).toBe(characterData.background);
      expect(character.interests).toEqual(characterData.interests);
      expect(character.occupation).toBe(characterData.occupation);
      expect(character.age).toBe(characterData.age);
      expect(character.cloudflareImageId).toBe(characterData.cloudflareImageId);
      expect(character.introMessage).toBe(characterData.introMessage);
      expect(character.greedFactor).toBe(characterData.greedFactor);
      expect(character.public).toBe(false);
    });
  });

  describe('Likes System', () => {
    it('should track likes and likedBy users', async () => {
      const character = await Character.create({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      const userIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      character.likes = 3;
      character.likedBy = userIds;
      await character.save();

      const foundCharacter = await Character.findById(character._id);
      expect(foundCharacter.likes).toBe(3);
      expect(foundCharacter.likedBy.map(id => id.toString())).toEqual(
        userIds.map(id => id.toString())
      );
    });
  });

  describe('Relationships', () => {
    it('should reference creator User', async () => {
      const creatorId = new mongoose.Types.ObjectId();
      const character = await Character.create({
        name: faker.person.firstName(),
        creator: creatorId,
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });

      expect(character.creator.toString()).toBe(creatorId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should auto-generate createdAt timestamp', async () => {
      const before = new Date();
      
      const character = await Character.create({
        name: faker.person.firstName(),
        creator: new mongoose.Types.ObjectId(),
        imageUrl: faker.image.url(),
        description: faker.lorem.paragraph(),
        personality: faker.lorem.sentence()
      });
      
      const after = new Date();

      expect(character.createdAt).toBeDefined();
      expect(character.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(character.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});