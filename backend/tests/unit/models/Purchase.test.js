const Purchase = require('../../../models/Purchase');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Helper function to create base purchase data
const createBasePurchaseData = () => ({
  user: new mongoose.Types.ObjectId(),
  items: [
    {
      merchandise: new mongoose.Types.ObjectId(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: faker.number.float({ min: 10, max: 100, multipleOf: 0.01 }),
      creator: new mongoose.Types.ObjectId()
    }
  ],
  totalAmount: faker.number.float({ min: 10, max: 500 }),
  subtotal: faker.number.float({ min: 10, max: 400 }),
  paymentMethod: 'credit_card',
  shippingAddress: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.countryCode()
  }
});

describe('Purchase Model', () => {
  describe('Schema Validation', () => {
    it('should create valid purchase with all required fields', async () => {
      const purchaseData = createBasePurchaseData();

      const purchase = new Purchase(purchaseData);
      const savedPurchase = await purchase.save();

      expect(savedPurchase._id).toBeDefined();
      expect(savedPurchase.user).toEqual(purchaseData.user);
      expect(savedPurchase.items).toHaveLength(1);
      expect(savedPurchase.items[0].merchandise).toEqual(purchaseData.items[0].merchandise);
      expect(savedPurchase.items[0].quantity).toBe(purchaseData.items[0].quantity);
      expect(savedPurchase.items[0].price).toBe(purchaseData.items[0].price);
      expect(savedPurchase.totalAmount).toBe(purchaseData.totalAmount);
      expect(savedPurchase.subtotal).toBe(purchaseData.subtotal);
      expect(savedPurchase.paymentMethod).toBe('credit_card');
      expect(savedPurchase.status).toBe('pending'); // default
      expect(savedPurchase.isPaid).toBe(false); // default
      expect(savedPurchase.isShipped).toBe(false); // default
      expect(savedPurchase.isDelivered).toBe(false); // default
      expect(savedPurchase.shippingCost).toBe(0); // default
      expect(savedPurchase.taxAmount).toBe(0); // default
      expect(savedPurchase.createdAt).toBeDefined();
    });

    it('should require user', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.user;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should allow empty items array', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items = [];
      const purchase = new Purchase(purchaseData);

      const savedPurchase = await purchase.save();
      expect(savedPurchase.items).toEqual([]);
    });

    it('should require totalAmount', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.totalAmount;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should require subtotal', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.subtotal;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should require paymentMethod', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.paymentMethod;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });
  });

  describe('Items Validation', () => {
    it('should require merchandise reference in items', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.items[0].merchandise;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should require quantity in items', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.items[0].quantity;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should require price in items', async () => {
      const purchaseData = createBasePurchaseData();
      delete purchaseData.items[0].price;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should enforce minimum quantity of 1', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items[0].quantity = 0;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should enforce minimum price of 0', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items[0].price = -1;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should handle multiple items', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items = [
        {
          merchandise: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 19.99,
          creator: new mongoose.Types.ObjectId()
        },
        {
          merchandise: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 29.99,
          creator: new mongoose.Types.ObjectId()
        }
      ];

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.items).toHaveLength(2);
    });

    it('should store item size and color', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items[0].size = 'L';
      purchaseData.items[0].color = 'black';

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.items[0].size).toBe('L');
      expect(purchase.items[0].color).toBe('black');
    });

    it('should validate size enum values', async () => {
      const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'N/A'];

      for (const size of validSizes) {
        const purchaseData = createBasePurchaseData();
        purchaseData.items[0].size = size;
        const purchase = await Purchase.create(purchaseData);
        expect(purchase.items[0].size).toBe(size);
      }
    });
  });

  describe('Payment Method Validation', () => {
    it('should validate payment method enum values', async () => {
      const validMethods = ['credit_card', 'crypto', 'paypal'];

      for (const method of validMethods) {
        const purchaseData = createBasePurchaseData();
        purchaseData.paymentMethod = method;
        const purchase = await Purchase.create(purchaseData);
        expect(purchase.paymentMethod).toBe(method);
      }
    });

    it('should reject invalid payment method values', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.paymentMethod = 'invalid-method';
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    it('should validate status enum values', async () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

      for (const status of validStatuses) {
        const purchaseData = createBasePurchaseData();
        purchaseData.status = status;
        const purchase = await Purchase.create(purchaseData);
        expect(purchase.status).toBe(status);
      }
    });

    it('should reject invalid status values', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.status = 'invalid-status';
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should default to pending status', async () => {
      const purchase = await Purchase.create(createBasePurchaseData());
      expect(purchase.status).toBe('pending');
    });
  });

  describe('Amount Validation', () => {
    it('should enforce minimum totalAmount of 0', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.totalAmount = -1;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should enforce minimum subtotal of 0', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.subtotal = -1;
      const purchase = new Purchase(purchaseData);

      await expect(purchase.save()).rejects.toThrow();
    });

    it('should allow free purchases', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.totalAmount = 0;
      purchaseData.subtotal = 0;
      purchaseData.items[0].price = 0;

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.totalAmount).toBe(0);
      expect(purchase.subtotal).toBe(0);
    });
  });

  describe('Shipping Address', () => {
    it('should require all shipping address fields', async () => {
      const requiredFields = ['firstName', 'lastName', 'street', 'city', 'state', 'postalCode', 'country'];
      
      for (const field of requiredFields) {
        const purchaseData = createBasePurchaseData();
        delete purchaseData.shippingAddress[field];
        const purchase = new Purchase(purchaseData);

        await expect(purchase.save()).rejects.toThrow();
      }
    });

    it('should save complete shipping address', async () => {
      const shippingAddress = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        country: faker.location.countryCode(),
        phone: faker.phone.number(),
        email: faker.internet.email()
      };

      const purchaseData = createBasePurchaseData();
      purchaseData.shippingAddress = shippingAddress;

      const purchase = await Purchase.create(purchaseData);
      expect(purchase.shippingAddress).toEqual(shippingAddress);
    });
  });

  describe('Payment Integration', () => {
    it('should store stripe payment data', async () => {
      const stripeData = {
        stripePaymentIntent: 'pi_' + faker.string.alphanumeric(24),
        stripeClientSecret: 'pi_' + faker.string.alphanumeric(24) + '_secret_' + faker.string.alphanumeric(8)
      };

      const purchaseData = { ...createBasePurchaseData(), ...stripeData };
      const purchase = await Purchase.create(purchaseData);

      expect(purchase.stripePaymentIntent).toBe(stripeData.stripePaymentIntent);
      expect(purchase.stripeClientSecret).toBe(stripeData.stripeClientSecret);
    });
  });

  describe('Fulfillment Tracking', () => {
    it('should store printful order data', async () => {
      const printfulData = {
        printfulOrderId: faker.string.numeric(8),
        printfulOrderStatus: 'confirmed',
        printfulShippingMethod: 'STANDARD',
        trackingNumber: faker.string.alphanumeric(20).toUpperCase(),
        trackingUrl: faker.internet.url()
      };

      const purchaseData = { ...createBasePurchaseData(), ...printfulData };
      const purchase = await Purchase.create(purchaseData);

      expect(purchase.printfulOrderId).toBe(printfulData.printfulOrderId);
      expect(purchase.printfulOrderStatus).toBe(printfulData.printfulOrderStatus);
      expect(purchase.trackingNumber).toBe(printfulData.trackingNumber);
    });

    it('should track payment and shipping timestamps', async () => {
      const now = new Date();
      const purchaseData = createBasePurchaseData();
      purchaseData.isPaid = true;
      purchaseData.paidAt = now;
      purchaseData.isShipped = true;
      purchaseData.shippedAt = now;

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.isPaid).toBe(true);
      expect(purchase.paidAt.getTime()).toBe(now.getTime());
      expect(purchase.isShipped).toBe(true);
      expect(purchase.shippedAt.getTime()).toBe(now.getTime());
    });
  });

  describe('Creator Payouts', () => {
    it('should store creator payout data', async () => {
      const creatorPayouts = [
        {
          creator: new mongoose.Types.ObjectId(),
          amount: 15.99,
          status: 'pending',
          stripeTransferId: 'tr_' + faker.string.alphanumeric(24)
        }
      ];

      const purchaseData = createBasePurchaseData();
      purchaseData.creatorPayouts = creatorPayouts;

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.creatorPayouts).toHaveLength(1);
      expect(purchase.creatorPayouts[0].amount).toBe(15.99);
      expect(purchase.creatorPayouts[0].status).toBe('pending');
    });

    it('should validate payout status enum', async () => {
      const validStatuses = ['pending', 'paid', 'failed'];

      for (const status of validStatuses) {
        const purchaseData = createBasePurchaseData();
        purchaseData.creatorPayouts = [{
          creator: new mongoose.Types.ObjectId(),
          amount: 10,
          status
        }];

        const purchase = await Purchase.create(purchaseData);
        expect(purchase.creatorPayouts[0].status).toBe(status);
      }
    });
  });

  describe('Revenue Calculations', () => {
    it('should store revenue breakdown in items', async () => {
      const purchaseData = createBasePurchaseData();
      purchaseData.items[0].creatorRevenue = 15.99;
      purchaseData.items[0].platformFee = 3.20;
      purchaseData.items[0].productionCost = 8.80;

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.items[0].creatorRevenue).toBe(15.99);
      expect(purchase.items[0].platformFee).toBe(3.20);
      expect(purchase.items[0].productionCost).toBe(8.80);
    });
  });

  describe('Complex Purchase Scenarios', () => {
    it('should handle large orders with multiple creators', async () => {
      const items = [];
      const creators = [];
      
      for (let i = 0; i < 20; i++) {
        const creator = new mongoose.Types.ObjectId();
        creators.push(creator);
        items.push({
          merchandise: new mongoose.Types.ObjectId(),
          quantity: faker.number.int({ min: 1, max: 3 }),
          price: faker.number.float({ min: 10, max: 50, multipleOf: 0.01 }),
          creator
        });
      }

      const totalAmount = items.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );

      const purchaseData = createBasePurchaseData();
      purchaseData.items = items;
      purchaseData.totalAmount = totalAmount;
      purchaseData.subtotal = totalAmount;

      const purchase = await Purchase.create(purchaseData);

      expect(purchase.items).toHaveLength(20);
      expect(purchase.totalAmount).toBeCloseTo(totalAmount, 2);
    });
  });
});