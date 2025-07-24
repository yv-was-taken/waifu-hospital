const request = require('supertest');
const express = require('express');

// Mock the controllers
jest.mock('../../../controllers/merchandiseController', () => ({
  createMerchandise: jest.fn((req, res) => res.status(201).json({ _id: 'merch123' })),
  getMerchandise: jest.fn((req, res) => res.status(200).json([])),
  getMerchandiseById: jest.fn((req, res) => res.status(200).json({ _id: req.params.id })),
  getUserMerchandise: jest.fn((req, res) => res.status(200).json([])),
  updateMerchandise: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteMerchandise: jest.fn((req, res) => res.status(200).json({ msg: 'Deleted' })),
  createPrintfulVariant: jest.fn((req, res) => res.status(201).json({ variant: {} }))
}));

// Mock middleware
jest.mock('../../../middleware/authMiddleware', () => 
  jest.fn((req, res, next) => {
    req.user = { id: 'user123', username: 'testuser' };
    next();
  })
);

const merchandiseRoutes = require('../../../routes/merchandiseRoutes');
const merchandiseController = require('../../../controllers/merchandiseController');

const app = express();
app.use(express.json());
app.use('/api/merchandise', merchandiseRoutes);

describe('Merchandise Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/merchandise', () => {
    it('should call createMerchandise with auth', async () => {
      const response = await request(app)
        .post('/api/merchandise')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Merchandise',
          price: 29.99,
          characterId: 'char123'
        });

      expect(response.status).toBe(201);
      expect(merchandiseController.createMerchandise).toHaveBeenCalled();
    });
  });

  describe('GET /api/merchandise', () => {
    it('should call getMerchandise', async () => {
      const response = await request(app)
        .get('/api/merchandise');

      expect(response.status).toBe(200);
      expect(merchandiseController.getMerchandise).toHaveBeenCalled();
    });

    it('should pass query parameters', async () => {
      merchandiseController.getMerchandise.mockImplementation((req, res) => {
        expect(req.query.category).toBe('apparel');
        res.status(200).json([]);
      });

      await request(app)
        .get('/api/merchandise?category=apparel');

      expect(merchandiseController.getMerchandise).toHaveBeenCalled();
    });
  });

  describe('GET /api/merchandise/:id', () => {
    it('should call getMerchandiseById', async () => {
      const response = await request(app)
        .get('/api/merchandise/merch123');

      expect(response.status).toBe(200);
      expect(merchandiseController.getMerchandiseById).toHaveBeenCalled();
    });
  });

  describe('GET /api/merchandise/user/:userId', () => {
    it('should call getUserMerchandise', async () => {
      const response = await request(app)
        .get('/api/merchandise/user/user123');

      expect(response.status).toBe(200);
      expect(merchandiseController.getUserMerchandise).toHaveBeenCalled();
    });
  });

  describe('PUT /api/merchandise/:id', () => {
    it('should call updateMerchandise with auth', async () => {
      const response = await request(app)
        .put('/api/merchandise/merch123')
        .set('Authorization', 'Bearer test-token')
        .send({ price: 34.99 });

      expect(response.status).toBe(200);
      expect(merchandiseController.updateMerchandise).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/merchandise/:id', () => {
    it('should call deleteMerchandise with auth', async () => {
      const response = await request(app)
        .delete('/api/merchandise/merch123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(merchandiseController.deleteMerchandise).toHaveBeenCalled();
    });
  });

  describe('POST /api/merchandise/:id/variant', () => {
    it('should call createPrintfulVariant with auth', async () => {
      const response = await request(app)
        .post('/api/merchandise/merch123/variant')
        .set('Authorization', 'Bearer test-token')
        .send({ 
          variant_id: 123,
          retail_price: 29.99
        });

      expect(response.status).toBe(201);
      expect(merchandiseController.createPrintfulVariant).toHaveBeenCalled();
    });
  });
});