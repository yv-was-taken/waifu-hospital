// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.BACKEND_URL = 'http://localhost:5000';
process.env.OPENAI_CHAT_API_KEY = 'sk-test-mock-key-123';
process.env.OPENAI_IMAGE_API_KEY = 'sk-test-mock-key-123';

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};