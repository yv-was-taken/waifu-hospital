const { Character, getCharacterById, setCharacters } = require('../../models/Character');
const { faker } = require('@faker-js/faker');

describe('AI Service Character Model', () => {
  describe('Character Class', () => {
    it('should create character with all properties', () => {
      const characterData = {
        id: faker.database.mongodbObjectId(),
        name: faker.person.firstName(),
        personality: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        interests: [faker.music.genre(), faker.music.genre()],
        background: faker.lorem.paragraph(),
        occupation: faker.person.jobTitle(),
        age: faker.number.int({ min: 18, max: 50 }),
        greedFactor: faker.number.int({ min: 0, max: 5 })
      };

      const character = new Character(
        characterData.id,
        characterData.name,
        characterData.personality,
        characterData.description,
        characterData.interests,
        characterData.background,
        characterData.occupation,
        characterData.age,
        characterData.greedFactor
      );

      expect(character.id).toBe(characterData.id);
      expect(character.name).toBe(characterData.name);
      expect(character.personality).toBe(characterData.personality);
      expect(character.description).toBe(characterData.description);
      expect(character.interests).toEqual(characterData.interests);
      expect(character.background).toBe(characterData.background);
      expect(character.occupation).toBe(characterData.occupation);
      expect(character.age).toBe(characterData.age);
      expect(character.greedFactor).toBe(characterData.greedFactor);
    });

    it('should handle optional properties with defaults', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        faker.person.firstName(),
        faker.lorem.sentence(),
        faker.lorem.paragraph()
      );

      expect(character.interests).toEqual([]);
      expect(character.background).toBe('');
      expect(character.occupation).toBe('');
      expect(character.age).toBeNull();
      expect(character.greedFactor).toBe(2);
    });
  });

  describe('getSystemPrompt', () => {
    it('should generate system prompt with all character details', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Alice',
        'friendly and helpful',
        'A kind medical professional',
        ['medicine', 'helping others'],
        'Grew up in a medical family',
        'doctor',
        28,
        1
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('You are an expert AI specifically calibrated to perfectly embody Alice');
      expect(prompt).toContain('doctor');
      expect(prompt).toContain('28 years old');
      expect(prompt).toContain('Your personality is friendly and helpful');
      expect(prompt).toContain('A kind medical professional');
      expect(prompt).toContain('Your background: Grew up in a medical family');
      expect(prompt).toContain('Your interests include: medicine, helping others');
      expect(prompt).toContain('GREED FACTOR 1');
      expect(prompt).toContain('you ARE Alice');
    });

    it('should generate prompt without optional fields', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Bob',
        'mysterious',
        'A character of few words'
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('You are an expert AI specifically calibrated to perfectly embody Bob');
      expect(prompt).toContain('Your personality is mysterious');
      expect(prompt).toContain('A character of few words');
      expect(prompt).not.toContain('Your background:');
      expect(prompt).not.toContain('Your interests include:');
      expect(prompt).not.toContain('years old');
    });

    it('should handle greed factor 0 (no merchandise mentions)', () => {
      // Since greedFactor constructor uses || 2, we need to manually set it after creation
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Zen',
        'peaceful',
        'A zen master',
        [],
        '',
        '',
        null,
        undefined
      );
      character.greedFactor = 0; // Manually set to 0 after construction

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('STRICTLY FORBIDDEN: Never mention or promote merchandise, donations, or any form of monetization');
    });

    it('should handle greed factor 5 (maximum greed)', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Greedy',
        'money-focused',
        'Loves capitalism',
        [],
        '',
        '',
        null,
        5
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('GREED FACTOR 5');
      expect(prompt).toContain('once every 2 messages');
    });

    it('should handle undefined greed factor with default', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Default',
        'normal',
        'Regular character'
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('GREED FACTOR 2');
      expect(prompt).toContain('once every 7 messages');
    });

    it('should include romantic interaction instructions', () => {
      const character = new Character(
        faker.database.mongodbObjectId(),
        'Romantic',
        'charming',
        'A romantic character'
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain('If the user expresses romantic interest or flirts with you');
      expect(prompt).toContain('respond warmly and flirt back');
    });

    it('should include all greed factor levels', () => {
      for (let greedFactor = 0; greedFactor <= 5; greedFactor++) {
        const character = new Character(
          faker.database.mongodbObjectId(),
          `Character${greedFactor}`,
          'test personality',
          'test description',
          [],
          '',
          '',
          null,
          greedFactor || undefined // Use undefined for 0 to avoid || default behavior
        );
        if (greedFactor === 0) {
          character.greedFactor = 0; // Manually set to 0 after construction
        }

        const prompt = character.getSystemPrompt();

        switch (greedFactor) {
          case 0:
            expect(prompt).toContain('STRICTLY FORBIDDEN');
            break;
          case 1:
            expect(prompt).toContain('once every 10 messages');
            break;
          case 2:
            expect(prompt).toContain('once every 7 messages');
            break;
          case 3:
            expect(prompt).toContain('once every 5 messages');
            break;
          case 4:
            expect(prompt).toContain('once every 3 messages');
            break;
          case 5:
            expect(prompt).toContain('once every 2 messages');
            break;
        }
      }
    });
  });

  describe('Character Management Functions', () => {
    beforeEach(() => {
      // Reset characters array before each test
      setCharacters([]);
    });

    describe('setCharacters', () => {
      it('should set characters from database format', () => {
        const dbCharacters = [
          {
            _id: faker.database.mongodbObjectId(),
            name: faker.person.firstName(),
            personality: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            interests: [faker.music.genre()],
            background: faker.lorem.paragraph(),
            occupation: faker.person.jobTitle(),
            age: faker.number.int({ min: 18, max: 50 }),
            greedFactor: faker.number.int({ min: 0, max: 5 })
          },
          {
            _id: faker.database.mongodbObjectId(),
            name: faker.person.firstName(),
            personality: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            interests: [],
            background: '',
            occupation: '',
            age: null,
            greedFactor: 2
          }
        ];

        setCharacters(dbCharacters);

        const retrievedCharacter1 = getCharacterById(dbCharacters[0]._id);
        const retrievedCharacter2 = getCharacterById(dbCharacters[1]._id);

        expect(retrievedCharacter1).toBeInstanceOf(Character);
        expect(retrievedCharacter1.id).toBe(dbCharacters[0]._id);
        expect(retrievedCharacter1.name).toBe(dbCharacters[0].name);

        expect(retrievedCharacter2).toBeInstanceOf(Character);
        expect(retrievedCharacter2.id).toBe(dbCharacters[1]._id);
        expect(retrievedCharacter2.interests).toEqual([]);
      });

      it('should handle empty characters array', () => {
        setCharacters([]);

        const character = getCharacterById('nonexistent-id');
        expect(character).toBeNull();
      });

      it('should overwrite existing characters', () => {
        const firstSet = [
          {
            _id: 'character-1',
            name: 'First Character',
            personality: 'first personality',
            description: 'first description'
          }
        ];

        const secondSet = [
          {
            _id: 'character-2',
            name: 'Second Character',
            personality: 'second personality',
            description: 'second description'
          }
        ];

        setCharacters(firstSet);
        expect(getCharacterById('character-1')).not.toBeNull();

        setCharacters(secondSet);
        expect(getCharacterById('character-1')).toBeNull();
        expect(getCharacterById('character-2')).not.toBeNull();
      });
    });

    describe('getCharacterById', () => {
      it('should return character by ID', () => {
        const characterId = faker.database.mongodbObjectId();
        const dbCharacters = [
          {
            _id: characterId,
            name: faker.person.firstName(),
            personality: faker.lorem.sentence(),
            description: faker.lorem.paragraph()
          }
        ];

        setCharacters(dbCharacters);

        const character = getCharacterById(characterId);

        expect(character).toBeInstanceOf(Character);
        expect(character.id).toBe(characterId);
        expect(character.name).toBe(dbCharacters[0].name);
      });

      it('should return null for non-existent character', () => {
        const dbCharacters = [
          {
            _id: 'existing-character',
            name: faker.person.firstName(),
            personality: faker.lorem.sentence(),
            description: faker.lorem.paragraph()
          }
        ];

        setCharacters(dbCharacters);

        const character = getCharacterById('non-existent-character');

        expect(character).toBeNull();
      });

      it('should return null when no characters are set', () => {
        const character = getCharacterById('any-id');

        expect(character).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle character with null/undefined values', () => {
      const character = new Character(
        'test-id',
        'Test',
        null,
        undefined,
        null,
        undefined,
        null,
        undefined,
        undefined
      );

      expect(character.personality).toBeNull();
      expect(character.description).toBeUndefined();
      expect(character.interests).toEqual([]);
      expect(character.background).toBe('');
      expect(character.occupation).toBe('');
      expect(character.age).toBeNull();
      expect(character.greedFactor).toBe(2);
    });

    it('should handle very long character data', () => {
      const longText = 'a'.repeat(10000);
      const character = new Character(
        'test-id',
        'Long Character',
        longText,
        longText,
        Array(100).fill('interest'),
        longText,
        longText,
        999,
        3
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain(longText);
      expect(character.interests).toHaveLength(100);
    });

    it('should handle special characters in character data', () => {
      const specialText = 'Character with "quotes" and \'apostrophes\' and emojis 🎭🎪';
      const character = new Character(
        'test-id',
        specialText,
        specialText,
        specialText,
        [specialText],
        specialText,
        specialText,
        25,
        1
      );

      const prompt = character.getSystemPrompt();

      expect(prompt).toContain(specialText);
      expect(character.interests[0]).toBe(specialText);
    });
  });
});