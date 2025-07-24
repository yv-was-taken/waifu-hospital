const Merchandise = require('../../../models/Merchandise');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Helper function to create base merchandise data
const createBaseMerchData = () => ({
  name: faker.commerce.productName(),
  price: faker.number.float({ min: 0.01, max: 999.99, multipleOf: 0.01 }),
  imageUrl: faker.image.url(),
  description: faker.commerce.productDescription(),
  character: new mongoose.Types.ObjectId(),
  creator: new mongoose.Types.ObjectId(),
  category: 't-shirt',
  variantId: faker.number.int({ min: 1, max: 1000 })
});

describe('Merchandise Model', () => {
  describe('Schema Validation', () => {
    it('should create valid merchandise with all required fields', async () => {
      const merchData = createBaseMerchData();

      const merch = new Merchandise(merchData);
      const savedMerch = await merch.save();

      expect(savedMerch._id).toBeDefined();
      expect(savedMerch.name).toBe(merchData.name);
      expect(savedMerch.price).toBe(merchData.price);
      expect(savedMerch.imageUrl).toBe(merchData.imageUrl);
      expect(savedMerch.description).toBe(merchData.description);
      expect(savedMerch.character).toEqual(merchData.character);
      expect(savedMerch.creator).toEqual(merchData.creator);
      expect(savedMerch.category).toBe(merchData.category);
      expect(savedMerch.variantId).toBe(merchData.variantId);
      expect(savedMerch.stock).toBe(100); // default
      expect(savedMerch.sold).toBe(0); // default
      expect(savedMerch.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      const merchData = createBaseMerchData();
      delete merchData.name;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require price', async () => {
      const merchData = createBaseMerchData();
      delete merchData.price;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require imageUrl', async () => {
      const merchData = createBaseMerchData();
      delete merchData.imageUrl;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require description', async () => {
      const merchData = createBaseMerchData();
      delete merchData.description;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require character reference', async () => {
      const merchData = createBaseMerchData();
      delete merchData.character;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require creator reference', async () => {
      const merchData = createBaseMerchData();
      delete merchData.creator;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require category', async () => {
      const merchData = createBaseMerchData();
      delete merchData.category;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should require variantId', async () => {
      const merchData = createBaseMerchData();
      delete merchData.variantId;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should trim name', async () => {
      const merchData = createBaseMerchData();
      merchData.name = '  Test Product  ';

      const merch = new Merchandise(merchData);
      const savedMerch = await merch.save();

      expect(savedMerch.name).toBe('Test Product');
    });
  });

  describe('Price Validation', () => {
    it('should enforce minimum price of 0', async () => {
      const merchData = createBaseMerchData();
      merchData.price = -1;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should allow price of 0', async () => {
      const merchData = createBaseMerchData();
      merchData.price = 0;
      const merch = new Merchandise(merchData);

      const savedMerch = await merch.save();
      expect(savedMerch.price).toBe(0);
    });

    it('should handle decimal prices correctly', async () => {
      const prices = [0.99, 19.99, 99.50, 199.00];
      
      for (const price of prices) {
        const merchData = createBaseMerchData();
        merchData.price = price;
        const merch = await Merchandise.create(merchData);

        expect(merch.price).toBe(price);
      }
    });
  });

  describe('Category Validation', () => {
    it('should validate category enum values', async () => {
      const validCategories = ['t-shirt', 'hoodie', 'hat', 'mug', 'mousepad', 'sticker'];

      for (const category of validCategories) {
        const merchData = createBaseMerchData();
        merchData.category = category;
        const merch = new Merchandise(merchData);

        const savedMerch = await merch.save();
        expect(savedMerch.category).toBe(category);
      }
    });

    it('should reject invalid category values', async () => {
      const merchData = createBaseMerchData();
      merchData.category = 'invalid-category';
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });
  });

  describe('Stock Validation', () => {
    it('should enforce minimum stock of 0', async () => {
      const merchData = createBaseMerchData();
      merchData.stock = -1;
      const merch = new Merchandise(merchData);

      await expect(merch.save()).rejects.toThrow();
    });

    it('should allow stock updates', async () => {
      const merch = await Merchandise.create(createBaseMerchData());

      expect(merch.stock).toBe(100); // default

      merch.stock = 50;
      await merch.save();
      expect(merch.stock).toBe(50);
    });
  });

  describe('Sales Tracking', () => {
    it('should allow negative sold count (no validation on sold field)', async () => {
      const merchData = createBaseMerchData();
      merchData.sold = -1;
      const merch = new Merchandise(merchData);

      const savedMerch = await merch.save();
      expect(savedMerch.sold).toBe(-1);
    });

    it('should track sold count', async () => {
      const merch = await Merchandise.create(createBaseMerchData());

      expect(merch.sold).toBe(0);

      merch.sold = 10;
      await merch.save();
      expect(merch.sold).toBe(10);
    });
  });

  describe('Available Sizes and Colors', () => {
    it('should store available sizes array', async () => {
      const sizes = ['S', 'M', 'L', 'XL'];
      const merchData = createBaseMerchData();
      merchData.availableSizes = sizes;
      
      const merch = await Merchandise.create(merchData);
      expect(merch.availableSizes).toEqual(sizes);
    });

    it('should validate size enum values', async () => {
      const validSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'N/A'];
      
      for (const size of validSizes) {
        const merchData = createBaseMerchData();
        merchData.availableSizes = [size];
        const merch = await Merchandise.create(merchData);
        expect(merch.availableSizes).toEqual([size]);
      }
    });

    it('should store available colors array', async () => {
      const colors = ['red', 'blue', 'green'];
      const merchData = createBaseMerchData();
      merchData.availableColors = colors;
      
      const merch = await Merchandise.create(merchData);
      expect(merch.availableColors).toEqual(colors);
    });
  });

  describe('Printful Integration', () => {
    it('should store printful product data', async () => {
      const printfulData = {
        printfulProductId: faker.string.numeric(5),
        printfulExternalId: faker.string.uuid(),
        printfulVariants: [
          {
            variantId: faker.string.numeric(5),
            externalId: faker.string.uuid(),
            retailPrice: faker.number.float({ min: 10, max: 100 }),
            size: 'M',
            color: 'black'
          }
        ]
      };

      const merchData = { ...createBaseMerchData(), ...printfulData };
      const merch = await Merchandise.create(merchData);

      expect(merch.printfulProductId).toBe(printfulData.printfulProductId);
      expect(merch.printfulExternalId).toBe(printfulData.printfulExternalId);
      expect(merch.printfulVariants).toHaveLength(1);
      expect(merch.printfulVariants[0]).toMatchObject(printfulData.printfulVariants[0]);
    });
  });

  describe('Revenue Tracking', () => {
    it('should store revenue percentages', async () => {
      const merchData = createBaseMerchData();
      merchData.creatorRevenuePercent = 75;
      merchData.platformFeePercent = 25;
      
      const merch = await Merchandise.create(merchData);

      expect(merch.creatorRevenuePercent).toBe(75);
      expect(merch.platformFeePercent).toBe(25);
    });

    it('should default revenue percentages', async () => {
      const merch = await Merchandise.create(createBaseMerchData());

      expect(merch.creatorRevenuePercent).toBe(80);
      expect(merch.platformFeePercent).toBe(20);
    });
  });

  describe('Approval System', () => {
    it('should default to not approved', async () => {
      const merch = await Merchandise.create(createBaseMerchData());

      expect(merch.isApproved).toBe(false);
    });

    it('should allow approving merchandise', async () => {
      const merch = await Merchandise.create(createBaseMerchData());

      merch.isApproved = true;
      await merch.save();
      
      const foundMerch = await Merchandise.findById(merch._id);
      expect(foundMerch.isApproved).toBe(true);
    });
  });
});