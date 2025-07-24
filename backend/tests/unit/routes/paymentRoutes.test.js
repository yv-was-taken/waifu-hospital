const request = require('supertest');
const express = require('express');

// Mock the controllers
jest.mock('../../../controllers/paymentController', () => ({
  createPaymentIntent: jest.fn((req, res) => res.status(200).json({ clientSecret: 'test_secret' })),
  confirmPayment: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPaymentHistory: jest.fn((req, res) => res.status(200).json([])),
  createStripeAccount: jest.fn((req, res) => res.status(201).json({ accountId: 'acct_123' })),
  getStripeAccountStatus: jest.fn((req, res) => res.status(200).json({ status: 'active' })),
  createAccountLink: jest.fn((req, res) => res.status(200).json({ url: 'https://connect.stripe.com' })),
  getPayoutHistory: jest.fn((req, res) => res.status(200).json([])),
  createPayout: jest.fn((req, res) => res.status(201).json({ payoutId: 'po_123' }))
}));

// Mock middleware
jest.mock('../../../middleware/authMiddleware', () => 
  jest.fn((req, res, next) => {
    req.user = { id: 'user123', username: 'testuser' };
    next();
  })
);

const paymentRoutes = require('../../../routes/paymentRoutes');
const paymentController = require('../../../controllers/paymentController');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create-payment-intent', () => {
    it('should call createPaymentIntent with auth', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', 'Bearer test-token')
        .send({
          amount: 1000,
          items: [{ id: 'item1', quantity: 1 }]
        });

      expect(response.status).toBe(200);
      expect(paymentController.createPaymentIntent).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/confirm', () => {
    it('should call confirmPayment with auth', async () => {
      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentIntentId: 'pi_123',
          items: []
        });

      expect(response.status).toBe(200);
      expect(paymentController.confirmPayment).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/history', () => {
    it('should call getPaymentHistory with auth', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(paymentController.getPaymentHistory).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/stripe/account', () => {
    it('should call createStripeAccount with auth', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/account')
        .set('Authorization', 'Bearer test-token')
        .send({
          email: 'creator@example.com',
          country: 'US'
        });

      expect(response.status).toBe(201);
      expect(paymentController.createStripeAccount).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/stripe/account', () => {
    it('should call getStripeAccountStatus with auth', async () => {
      const response = await request(app)
        .get('/api/payments/stripe/account')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(paymentController.getStripeAccountStatus).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/stripe/account-link', () => {
    it('should call createAccountLink with auth', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/account-link')
        .set('Authorization', 'Bearer test-token')
        .send({
          accountId: 'acct_123',
          refreshUrl: 'https://example.com/refresh',
          returnUrl: 'https://example.com/return'
        });

      expect(response.status).toBe(200);
      expect(paymentController.createAccountLink).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/payouts', () => {
    it('should call getPayoutHistory with auth', async () => {
      const response = await request(app)
        .get('/api/payments/payouts')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(paymentController.getPayoutHistory).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/payouts', () => {
    it('should call createPayout with auth', async () => {
      const response = await request(app)
        .post('/api/payments/payouts')
        .set('Authorization', 'Bearer test-token')
        .send({
          amount: 5000,
          currency: 'usd'
        });

      expect(response.status).toBe(201);
      expect(paymentController.createPayout).toHaveBeenCalled();
    });
  });
});