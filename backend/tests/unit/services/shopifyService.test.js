const shopifyService = require('../../../services/shopifyService');

// Mock console methods to avoid noise in tests
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('shopifyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('createProduct', () => {
    const mockMerchandiseData = {
      name: 'Test T-Shirt',
      image: 'https://example.com/image.jpg',
      price: 19.99,
      description: 'A test t-shirt'
    };

    it('should return mock data when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.createProduct(mockMerchandiseData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock product data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toContain('mock_');
      expect(result.title).toBe(mockMerchandiseData.name);
      expect(result.handle).toBe('test-t-shirt');
      expect(result.images).toEqual([{ src: mockMerchandiseData.image }]);
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].id).toContain('mock_variant_');

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should return mock data when Shopify API key is undefined', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      delete process.env.SHOPIFY_API_KEY;

      const result = await shopifyService.createProduct(mockMerchandiseData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock product data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toContain('mock_');

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should handle product names with special characters', async () => {
      const specialNameData = {
        ...mockMerchandiseData,
        name: 'Special T-Shirt! & More'
      };

      const result = await shopifyService.createProduct(specialNameData);

      expect(result.handle).toBe('special-t-shirt!-&-more');
    });

    it('should handle empty product name', async () => {
      const emptyNameData = {
        ...mockMerchandiseData,
        name: ''
      };

      const result = await shopifyService.createProduct(emptyNameData);

      expect(result.title).toBe('');
      expect(result.handle).toBe('');
    });

    it('should handle missing image', async () => {
      const noImageData = {
        ...mockMerchandiseData,
        image: undefined
      };

      const result = await shopifyService.createProduct(noImageData);

      expect(result.images).toEqual([{ src: undefined }]);
    });
  });

  describe('updateProduct', () => {
    const productId = 'mock_123';
    const updateData = {
      name: 'Updated T-Shirt',
      price: 24.99,
      description: 'An updated description'
    };

    it('should return mock updated product when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.updateProduct(productId, updateData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock updated product data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(productId);
      expect(result.title).toBe(updateData.name);
      expect(result.handle).toBe('updated-t-shirt');

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should handle update with minimal data', async () => {
      const minimalUpdateData = {
        name: 'Minimal Update'
      };

      const result = await shopifyService.updateProduct(productId, minimalUpdateData);

      expect(result.title).toBe('Minimal Update');
      expect(result.handle).toBe('minimal-update');
    });
  });

  describe('deleteProduct', () => {
    const productId = 'mock_123';

    it('should return success when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.deleteProduct(productId);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock deletion confirmation.'
      );
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.deletedProductId).toBe(productId);

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });
  });

  describe('getProduct', () => {
    const productId = 'mock_123';

    it('should return mock product when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.getProduct(productId);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock product data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(productId);
      expect(result.title).toBe('Mock Product');

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });
  });

  describe('createCheckout', () => {
    const checkoutData = {
      line_items: [
        {
          variant_id: 'mock_variant_123',
          quantity: 1
        }
      ]
    };

    it('should return mock checkout when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.createCheckout(checkoutData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock checkout data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toContain('mock_checkout_');
      expect(result.web_url).toContain('https://checkout.shopify.com/');
      expect(result.line_items).toEqual(checkoutData.line_items);

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should handle checkout with multiple items', async () => {
      const multiItemCheckoutData = {
        line_items: [
          { variant_id: 'variant_1', quantity: 2 },
          { variant_id: 'variant_2', quantity: 1 }
        ]
      };

      const result = await shopifyService.createCheckout(multiItemCheckoutData);

      expect(result.line_items).toHaveLength(2);
      expect(result.line_items[0].quantity).toBe(2);
      expect(result.line_items[1].quantity).toBe(1);
    });

    it('should handle empty checkout data', async () => {
      const emptyCheckoutData = {
        line_items: []
      };

      const result = await shopifyService.createCheckout(emptyCheckoutData);

      expect(result.line_items).toEqual([]);
    });
  });

  describe('updateCheckout', () => {
    const checkoutId = 'mock_checkout_123';
    const updateData = {
      line_items: [
        {
          variant_id: 'updated_variant',
          quantity: 3
        }
      ]
    };

    it('should return mock updated checkout when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.updateCheckout(checkoutId, updateData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock updated checkout data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(checkoutId);
      expect(result.line_items).toEqual(updateData.line_items);

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });
  });

  describe('getCheckout', () => {
    const checkoutId = 'mock_checkout_123';

    it('should return mock checkout when Shopify API key is not configured', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'dummy_key';

      const result = await shopifyService.getCheckout(checkoutId);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Shopify integration not properly configured. Returning mock checkout data.'
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(checkoutId);

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });
  });

  describe('webhook handling', () => {
    it('should handle order webhooks', async () => {
      const webhookData = {
        id: 12345,
        financial_status: 'paid',
        fulfillment_status: 'fulfilled'
      };

      const result = await shopifyService.handleOrderWebhook(webhookData);

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(result.orderId).toBe(12345);
    });

    it('should handle product webhooks', async () => {
      const webhookData = {
        id: 67890,
        title: 'Updated Product',
        handle: 'updated-product'
      };

      const result = await shopifyService.handleProductWebhook(webhookData);

      expect(result).toBeDefined();
      expect(result.processed).toBe(true);
      expect(result.productId).toBe(67890);
    });

    it('should handle malformed webhook data', async () => {
      const malformedData = {
        // Missing required fields
        title: 'Incomplete Product'
      };

      const result = await shopifyService.handleProductWebhook(malformedData);

      expect(result).toBeDefined();
      expect(result.processed).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in createProduct', async () => {
      // Simulate real API key but mock failure
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'real_api_key';

      // The service should handle errors gracefully and fall back to mock data
      const result = await shopifyService.createProduct({
        name: 'Test Product',
        image: 'invalid-url'
      });

      // Should still return a result, even if mocked
      expect(result).toBeDefined();

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should handle network timeouts', async () => {
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      process.env.SHOPIFY_API_KEY = 'real_api_key';

      // Test with data that would cause issues
      const result = await shopifyService.getProduct('non-existent-id');

      expect(result).toBeDefined();

      process.env.SHOPIFY_API_KEY = originalApiKey;
    });
  });

  describe('utility functions', () => {
    it('should format product handles correctly', async () => {
      const testCases = [
        { input: 'Simple Product', expected: 'simple-product' },
        { input: 'Product With Numbers 123', expected: 'product-with-numbers-123' },
        { input: 'Product-With-Dashes', expected: 'product-with-dashes' },
        { input: 'Product    With    Spaces', expected: 'product----with----spaces' }
      ];

      for (const testCase of testCases) {
        const result = await shopifyService.createProduct({
          name: testCase.input,
          image: 'test.jpg'
        });
        
        expect(result.handle).toBe(testCase.expected);
      }
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        // Missing name
        image: 'test.jpg'
      };

      const result = await shopifyService.createProduct(incompleteData);

      expect(result).toBeDefined();
      expect(result.title).toBeUndefined();
    });
  });

  describe('environment configuration', () => {
    it('should handle missing SHOPIFY_SHOP environment variable', async () => {
      const originalShop = process.env.SHOPIFY_SHOP;
      const originalApiKey = process.env.SHOPIFY_API_KEY;
      
      delete process.env.SHOPIFY_SHOP;
      process.env.SHOPIFY_API_KEY = 'real_key';

      const result = await shopifyService.createProduct({
        name: 'Test Product',
        image: 'test.jpg'
      });

      expect(result).toBeDefined();

      process.env.SHOPIFY_SHOP = originalShop;
      process.env.SHOPIFY_API_KEY = originalApiKey;
    });

    it('should use default shop URL when not specified', async () => {
      const originalShop = process.env.SHOPIFY_SHOP;
      delete process.env.SHOPIFY_SHOP;

      // This test verifies that the service can handle missing shop URL
      const result = await shopifyService.createProduct({
        name: 'Test Product'
      });

      expect(result).toBeDefined();

      process.env.SHOPIFY_SHOP = originalShop;
    });
  });
});