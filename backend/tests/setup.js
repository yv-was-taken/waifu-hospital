const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect and stop the in-memory MongoDB instance
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.AI_SERVICE_URL = 'http://localhost:5001';
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id';
process.env.CLOUDFLARE_ACCOUNT_HASH = 'test-account-hash';
process.env.CLOUDFLARE_IMAGES_API_KEY = 'test-api-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
process.env.PRINTFUL_STORE_API_KEY = 'test-printful-key';
process.env.SHOPIFY_API_KEY = 'test-shopify-key';
process.env.SHOPIFY_SHOP = 'test-shop.myshopify.com';