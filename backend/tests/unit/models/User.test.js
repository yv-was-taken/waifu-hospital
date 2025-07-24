const User = require('../../../models/User');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user with all required fields', async () => {
      const userData = {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.profilePicture).toBe('');
      expect(savedUser.bio).toBe('');
      expect(savedUser.characters).toEqual([]);
      expect(savedUser.paymentHistory).toEqual([]);
    });

    it('should require username', async () => {
      const user = new User({
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const user = new User({
        username: faker.internet.username(),
        password: faker.internet.password()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const user = new User({
        username: faker.internet.username(),
        email: faker.internet.email()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData = {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      };

      await User.create(userData);

      const duplicateUser = new User({
        ...userData,
        email: faker.internet.email() // Different email
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      };

      await User.create(userData);

      const duplicateUser = new User({
        ...userData,
        username: faker.internet.username() // Different username
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const user = new User({
        username: faker.internet.username(),
        email: 'invalid-email',
        password: faker.internet.password()
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password minimum length of 6', async () => {
      const user = new User({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: '12345'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should trim username', async () => {
      const user = new User({
        username: '  testuser  ',
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const savedUser = await user.save();
      expect(savedUser.username).toBe('testuser');
    });

    it('should lowercase email', async () => {
      const user = new User({
        username: faker.internet.username(),
        email: 'TEST@EMAIL.COM',
        password: faker.internet.password()
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@email.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = faker.internet.password();
      const user = new User({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: plainPassword
      });

      const savedUser = await user.save();
      expect(savedUser.password).not.toBe(plainPassword);
      
      const isMatch = await bcryptjs.compare(plainPassword, savedUser.password);
      expect(isMatch).toBe(true);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const originalHash = user.password;
      user.bio = 'Updated bio';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password when changed', async () => {
      const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const originalHash = user.password;
      const newPassword = faker.internet.password();
      user.password = newPassword;
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe(newPassword);
      
      const isMatch = await bcryptjs.compare(newPassword, user.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    describe('matchPassword', () => {
      it('should return true for correct password', async () => {
        const plainPassword = faker.internet.password();
        const user = await User.create({
          username: faker.internet.username(),
          email: faker.internet.email(),
          password: plainPassword
        });

        const isMatch = await user.matchPassword(plainPassword);
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const user = await User.create({
          username: faker.internet.username(),
          email: faker.internet.email(),
          password: faker.internet.password()
        });

        const isMatch = await user.matchPassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    // generateToken method doesn't exist in the actual User model
    // Removing this test as it's not implemented
  });

  describe('Relationships', () => {
    it('should store character references', async () => {
      const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const characterIds = [
        faker.database.mongodbObjectId(),
        faker.database.mongodbObjectId()
      ];

      user.characters = characterIds;
      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser.characters.map(id => id.toString())).toEqual(characterIds);
    });

    it('should store payment history references', async () => {
      const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const purchaseIds = [
        faker.database.mongodbObjectId(),
        faker.database.mongodbObjectId()
      ];

      user.paymentHistory = purchaseIds;
      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser.paymentHistory.map(id => id.toString())).toEqual(purchaseIds);
    });

    it('should store stripe connect data', async () => {
      const user = await User.create({
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password()
      });

      const stripeData = {
        accountId: 'acct_' + faker.string.alphanumeric(20),
        isOnboarded: true,
        payoutsEnabled: true,
        country: 'US',
        defaultCurrency: 'usd'
      };

      user.stripeConnect = stripeData;
      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser.stripeConnect.accountId).toBe(stripeData.accountId);
      expect(foundUser.stripeConnect.isOnboarded).toBe(true);
    });
  });

  describe('Optional Fields', () => {
    it('should save optional profile fields', async () => {
      const userData = {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        profilePicture: faker.image.avatar(),
        bio: faker.lorem.paragraph()
      };

      const user = await User.create(userData);

      expect(user.profilePicture).toBe(userData.profilePicture);
      expect(user.bio).toBe(userData.bio);
    });
  });
});