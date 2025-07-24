const printfulService = require('../../../services/printfulService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock constants
jest.mock('../../../constants', () => ({
  PRODUCT_IDS_BY_CATEGORY: {
    't-shirt': 71,
    'hoodie': 146,
    'mug': 19
  },
  VARIANT_IDS: {
    71: [4011, 4012, 4013],
    146: [5001, 5002, 5003],
    19: [1279, 1280, 1281]
  },
  VARIANT_IDS_BY_PRODUCT_ID: {
    71: [4011, 4012, 4013],
    146: [5001, 5002, 5003], 
    19: [1279, 1280, 1281]
  }
}));

describe('printfulService', () => {
  let axiosCreateMock;
  let printfulClientMock;

  beforeEach(() => {
    // Mock axios.create
    printfulClientMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    
    axiosCreateMock = jest.fn().mockReturnValue(printfulClientMock);
    axios.create = axiosCreateMock;

    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return mock data when using dummy API key', async () => {
      // The service automatically returns mock data when PRINTFUL_STORE_API_KEY is dummy
      const result = await printfulService.getProducts();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should call Printful API and return products with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockProducts = [
        { id: 1, name: 'T-Shirt', type: 'shirt' },
        { id: 2, name: 'Hoodie', type: 'hoodie' }
      ];

      printfulClientMock.get.mockResolvedValue({ 
        data: { result: mockProducts } 
      });

      const result = await printfulService.getProducts();

      expect(printfulClientMock.get).toHaveBeenCalledWith('/sync/products');
      expect(result).toEqual(mockProducts);

      // Restore original env
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should return mock data if API call fails', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      printfulClientMock.get.mockRejectedValue(new Error('API Error'));

      const result = await printfulService.getProducts();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Printful products:',
        'API Error'
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('getProductVariants', () => {
    it('should return mock data when using dummy API key', async () => {
      const result = await printfulService.getProductVariants('71');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should call Printful API and return variants with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockVariants = [
        { id: 4011, name: 'T-Shirt - S', size: 'S' },
        { id: 4012, name: 'T-Shirt - M', size: 'M' }
      ];

      printfulClientMock.get.mockResolvedValue({ 
        data: { result: { variants: mockVariants } } 
      });

      const result = await printfulService.getProductVariants('71');

      expect(printfulClientMock.get).toHaveBeenCalledWith('/sync/products/71');
      expect(result).toEqual(mockVariants);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should handle API errors gracefully', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      printfulClientMock.get.mockRejectedValue(new Error('Product not found'));

      const result = await printfulService.getProductVariants('invalid');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Printful product variants:',
        'Product not found'
      );
      expect(result).toBeDefined();

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('createProduct', () => {
    const mockProductData = {
      name: 'Custom T-Shirt',
      sync_product: {
        name: 'Custom T-Shirt',
        thumbnail: 'https://example.com/image.jpg'
      },
      sync_variants: [
        {
          variant_id: 4011,
          files: [
            {
              url: 'https://example.com/design.jpg'
            }
          ]
        }
      ]
    };

    it('should return mock data when using dummy API key', async () => {
      const result = await printfulService.createProduct(mockProductData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should call Printful API to create product with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        id: 12345,
        name: 'Custom T-Shirt',
        sync_product: mockProductData.sync_product,
        sync_variants: mockProductData.sync_variants
      };

      printfulClientMock.post.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.createProduct(mockProductData);

      expect(printfulClientMock.post).toHaveBeenCalledWith('/sync/products', mockProductData);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should handle creation errors', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      printfulClientMock.post.mockRejectedValue(new Error('Invalid product data'));

      const result = await printfulService.createProduct(mockProductData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Printful product:',
        'Invalid product data'
      );
      expect(result).toBeDefined();

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('createOrder', () => {
    const mockOrderData = {
      recipient: {
        name: 'John Doe',
        address1: '123 Main St',
        city: 'Test City',
        state_code: 'CA',
        country_code: 'US',
        zip: '12345'
      },
      items: [
        {
          sync_variant_id: 1,
          quantity: 1
        }
      ]
    };

    it('should return mock order when using dummy API key', async () => {
      const result = await printfulService.createOrder(mockOrderData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
    });

    it('should call Printful API to create order with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        id: 67890,
        status: 'draft',
        recipient: mockOrderData.recipient,
        items: mockOrderData.items
      };

      printfulClientMock.post.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.createOrder(mockOrderData);

      expect(printfulClientMock.post).toHaveBeenCalledWith('/orders', mockOrderData);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should handle order creation errors', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      printfulClientMock.post.mockRejectedValue(new Error('Invalid order data'));

      const result = await printfulService.createOrder(mockOrderData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Printful order:',
        'Invalid order data'
      );
      expect(result).toBeDefined();

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('calculateShipping', () => {
    const mockShippingData = {
      recipient: {
        country_code: 'US',
        state_code: 'CA'
      },
      items: [
        {
          variant_id: 4011,
          quantity: 1
        }
      ]
    };

    it('should return mock shipping cost when using dummy API key', async () => {
      const result = await printfulService.calculateShipping(mockShippingData);
      
      expect(result).toBeDefined();
      expect(result.costs).toBeDefined();
    });

    it('should call Printful API to calculate shipping with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        costs: {
          shipping: '5.00',
          tax: '1.00',
          total: '6.00'
        }
      };

      printfulClientMock.post.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.calculateShipping(mockShippingData);

      expect(printfulClientMock.post).toHaveBeenCalledWith('/shipping/rates', mockShippingData);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('getProductionCosts', () => {
    const variantId = '4011';

    it('should return mock production costs when using dummy API key', async () => {
      const result = await printfulService.getProductionCosts(variantId);
      
      expect(result).toBeDefined();
      expect(result.costs).toBeDefined();
    });

    it('should call Printful API to get production costs with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        costs: {
          variant: '10.50',
          branding: '2.00',
          total: '12.50'
        }
      };

      printfulClientMock.get.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.getProductionCosts(variantId);

      expect(printfulClientMock.get).toHaveBeenCalledWith(`/products/variant/${variantId}`);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('getOrderStatus', () => {
    const orderId = '67890';

    it('should return mock order status when using dummy API key', async () => {
      const result = await printfulService.getOrderStatus(orderId);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
      expect(result.status).toBeDefined();
    });

    it('should call Printful API to get order status with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        id: orderId,
        status: 'fulfilled',
        shipments: []
      };

      printfulClientMock.get.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.getOrderStatus(orderId);

      expect(printfulClientMock.get).toHaveBeenCalledWith(`/orders/${orderId}`);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('cancelOrder', () => {
    const orderId = '67890';

    it('should return success when using dummy API key', async () => {
      const result = await printfulService.cancelOrder(orderId);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should call Printful API to cancel order with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const mockResponse = {
        id: orderId,
        status: 'canceled'
      };

      printfulClientMock.delete.mockResolvedValue({ 
        data: { result: mockResponse } 
      });

      const result = await printfulService.cancelOrder(orderId);

      expect(printfulClientMock.delete).toHaveBeenCalledWith(`/orders/${orderId}`);
      expect(result).toEqual(mockResponse);

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('generateMockup', () => {
    const mockupData = {
      variant_ids: [4011],
      format: 'jpg',
      files: [
        {
          placement: 'front',
          image_url: 'https://example.com/design.jpg'
        }
      ]
    };

    it('should return null when using dummy API key', async () => {
      const result = await printfulService.generateMockup(mockupData);
      
      expect(result).toBeNull();
    });

    it('should handle mockup generation with real API key', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock the mockup generation to fail (as it's complex)
      printfulClientMock.post.mockRejectedValue(new Error('Mockup generation failed'));

      const result = await printfulService.generateMockup(mockupData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error generating mockup:',
        expect.any(Error)
      );
      expect(result).toBeNull();

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle network errors gracefully', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      printfulClientMock.get.mockRejectedValue(new Error('Network error'));

      const result = await printfulService.getProducts();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeDefined(); // Should return mock data as fallback

      consoleSpy.mockRestore();
      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should handle empty responses', async () => {
      const originalEnv = process.env.PRINTFUL_STORE_API_KEY;
      process.env.PRINTFUL_STORE_API_KEY = 'real_api_key';

      printfulClientMock.get.mockResolvedValue({ data: { result: null } });

      const result = await printfulService.getProducts();

      expect(result).toBeNull();

      process.env.PRINTFUL_STORE_API_KEY = originalEnv;
    });

    it('should use correct axios configuration', () => {
      expect(axiosCreateMock).toHaveBeenCalledWith({
        baseURL: 'https://api.printful.com',
        headers: {
          Authorization: 'Bearer dummy_printful_key',
          'Content-Type': 'application/json',
        },
      });
    });
  });
});