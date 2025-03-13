const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Configure Printful API client
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || "dummy_printful_key";
const PRINTFUL_API_URL = "https://api.printful.com";

// Configure axios instance for Printful API
const printfulClient = axios.create({
  baseURL: PRINTFUL_API_URL,
  headers: {
    Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Get available Printful products (catalog items)
 * @returns {Promise<Array>} List of available products
 */
const getProducts = async () => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockCatalogProducts();
    }

    const response = await printfulClient.get("/sync/products");
    return response.data.result;
  } catch (error) {
    console.error("Error fetching Printful products:", error.message);
    // Return mock data if API call fails
    return mockCatalogProducts();
  }
};

/**
 * Get available Printful product variants
 * @param {String} productId - Printful product ID
 * @returns {Promise<Array>} List of available variants for the product
 */
const getProductVariants = async (productId) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockProductVariants(productId);
    }

    const response = await printfulClient.get(
      `/sync/products/${productId}/variants`,
    );
    return response.data.result;
  } catch (error) {
    console.error(
      `Error fetching Printful product variants for ${productId}:`,
      error.message,
    );
    // Return mock data if API call fails
    return mockProductVariants(productId);
  }
};

/**
 * Create a new product in Printful
 * @param {Object} productData - Product data including name, imageUrl, variantId, etc.
 * @returns {Promise<Object>} Created product data
 */
const createProduct = async (productData) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockCreateProduct(productData);
    }

    const syncProduct = {
      sync_product: {
        name: productData.name,
      },
      sync_variants: [
        {
          variant_id: productData.variantId,
          files: [
            {
              url: productData.imageUrl,
            },
          ],
        },
      ],
    };

    // Add external ID if provided
    if (productData.externalId) {
      syncProduct.sync_product.external_id = productData.externalId;
    }

    const response = await printfulClient.post("/store/products", syncProduct);
    return response.data.result;
  } catch (error) {
    console.error("Error creating Printful product:", error.message);
    // Return mock data if API call fails
    return mockCreateProduct(productData);
  }
};

/**
 * Get variant properties based on product category
 * @param {String} category - Product category (t-shirt, mug, etc.)
 * @returns {Object} Variant properties
 */
const getVariantPropertiesForCategory = (category) => {
  // These would be actual Printful variant IDs and option IDs in production
  // For development, we're using mock values
  const properties = {
    "t-shirt": {
      variant_id: 1, // Mock product ID for a t-shirt
      size_option: "size",
      color_option: "color",
      print_position: "front",
    },
    mug: {
      variant_id: 2, // Mock product ID for a mug
      size_option: null,
      color_option: "color",
      print_position: "default",
    },
    poster: {
      variant_id: 3, // Mock product ID for a poster
      size_option: "size",
      color_option: null,
      print_position: "default",
    },
    sticker: {
      variant_id: 4, // Mock product ID for a sticker
      size_option: "size",
      color_option: null,
      print_position: "default",
    },
    hoodie: {
      variant_id: 5, // Mock product ID for a hoodie
      size_option: "size",
      color_option: "color",
      print_position: "front",
    },
    hat: {
      variant_id: 6, // Mock product ID for a hat
      size_option: "size",
      color_option: "color",
      print_position: "front",
    },
    phonecase: {
      variant_id: 7, // Mock product ID for a phone case
      size_option: "model",
      color_option: null,
      print_position: "default",
    },
    // Default for any other category
    other: {
      variant_id: 99,
      size_option: null,
      color_option: null,
      print_position: "default",
    },
  };

  return properties[category] || properties.other;
};

/**
 * Create an order in Printful
 * @param {Object} orderData - Order data including recipient, items, etc.
 * @returns {Promise<Object>} Created order data
 */
const createOrder = async (orderData) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockCreateOrder(orderData);
    }

    const order = {
      recipient: {
        name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
        address1: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state_code: orderData.shippingAddress.state,
        country_code: orderData.shippingAddress.country,
        zip: orderData.shippingAddress.postalCode,
        email: orderData.email,
        phone: orderData.phone,
      },
      items: orderData.items.map((item) => ({
        sync_variant_id: item.printfulVariantId,
        quantity: item.quantity,
        retail_price: item.price.toString(),
      })),
    };

    const response = await printfulClient.post("/orders", order);
    return response.data.result;
  } catch (error) {
    console.error("Error creating Printful order:", error.message);
    // Return mock data if API call fails
    return mockCreateOrder(orderData);
  }
};

/**
 * Calculate shipping rates for an order
 * @param {Object} orderData - Order data including recipient, items
 * @returns {Promise<Array>} Available shipping rates
 */
const calculateShipping = async (orderData) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockShippingRates();
    }

    const requestData = {
      recipient: {
        address1: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state_code: orderData.shippingAddress.state,
        country_code: orderData.shippingAddress.country,
        zip: orderData.shippingAddress.postalCode,
      },
      items: orderData.items.map((item) => ({
        variant_id: item.printfulVariantId,
        quantity: item.quantity,
      })),
    };

    const response = await printfulClient.post("/shipping/rates", requestData);
    return response.data.result;
  } catch (error) {
    console.error("Error calculating shipping rates:", error.message);
    // Return mock data if API call fails
    return mockShippingRates();
  }
};

/**
 * Get estimated production costs for a product
 * @param {String} variantId - Printful variant ID
 * @returns {Promise<Object>} Production costs data
 */
const getProductionCosts = async (variantId) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockProductionCosts(variantId);
    }

    const response = await printfulClient.get(`/products/variant/${variantId}`);
    return {
      variantId,
      productionCost: response.data.result.price,
    };
  } catch (error) {
    console.error(
      `Error getting production costs for variant ${variantId}:`,
      error.message,
    );
    // Return mock data if API call fails
    return mockProductionCosts(variantId);
  }
};

/**
 * Get order status from Printful
 * @param {String} orderId - Printful order ID
 * @returns {Promise<Object>} Order status data
 */
const getOrderStatus = async (orderId) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return mockOrderStatus(orderId);
    }

    const response = await printfulClient.get(`/orders/${orderId}`);
    return response.data.result;
  } catch (error) {
    console.error(`Error getting order status for ${orderId}:`, error.message);
    // Return mock data if API call fails
    return mockOrderStatus(orderId);
  }
};

/**
 * Cancel order in Printful
 * @param {String} orderId - Printful order ID
 * @returns {Promise<Object>} Cancellation confirmation
 */
const cancelOrder = async (orderId) => {
  try {
    // For development without API key
    if (PRINTFUL_API_KEY === "dummy_printful_key") {
      return { success: true, message: "Order cancelled" };
    }

    const response = await printfulClient.delete(`/orders/${orderId}`);
    return { success: true, data: response.data.result };
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error.message);
    if (error.response && error.response.status === 404) {
      return { success: false, message: "Order not found" };
    }
    return { success: false, message: error.message };
  }
};

// Mock functions for development

/**
 * Mock catalog products
 * @returns {Array} List of mock products
 */
const mockCatalogProducts = () => {
  return [
    {
      id: 1,
      name: "Classic T-Shirt",
      thumbnail_url: "https://example.com/tshirt.jpg",
      variants: [
        { id: 101, name: "White S", price: 18.95 },
        { id: 102, name: "White M", price: 18.95 },
        { id: 103, name: "White L", price: 18.95 },
        { id: 104, name: "Black S", price: 18.95 },
        { id: 105, name: "Black M", price: 18.95 },
        { id: 106, name: "Black L", price: 18.95 },
      ],
    },
    {
      id: 2,
      name: "Coffee Mug",
      thumbnail_url: "https://example.com/mug.jpg",
      variants: [
        { id: 201, name: "White 11oz", price: 12.95 },
        { id: 202, name: "Black 11oz", price: 12.95 },
      ],
    },
    {
      id: 3,
      name: "Poster",
      thumbnail_url: "https://example.com/poster.jpg",
      variants: [
        { id: 301, name: "18x24", price: 19.95 },
        { id: 302, name: "24x36", price: 29.95 },
      ],
    },
    {
      id: 4,
      name: "Sticker",
      thumbnail_url: "https://example.com/sticker.jpg",
      variants: [
        { id: 401, name: "3x3", price: 3.95 },
        { id: 402, name: "5x5", price: 5.95 },
      ],
    },
    {
      id: 5,
      name: "Hoodie",
      thumbnail_url: "https://example.com/hoodie.jpg",
      variants: [
        { id: 501, name: "Gray S", price: 34.95 },
        { id: 502, name: "Gray M", price: 34.95 },
        { id: 503, name: "Gray L", price: 34.95 },
        { id: 504, name: "Black S", price: 34.95 },
        { id: 505, name: "Black M", price: 34.95 },
        { id: 506, name: "Black L", price: 34.95 },
      ],
    },
  ];
};

/**
 * Mock product variants
 * @param {Number} productId - Product ID
 * @returns {Array} List of mock variants
 */
const mockProductVariants = (productId) => {
  const variantsByProduct = {
    1: [
      { id: 101, name: "White S", price: 18.95, variant_id: 101 },
      { id: 102, name: "White M", price: 18.95, variant_id: 102 },
      { id: 103, name: "White L", price: 18.95, variant_id: 103 },
      { id: 104, name: "Black S", price: 18.95, variant_id: 104 },
      { id: 105, name: "Black M", price: 18.95, variant_id: 105 },
      { id: 106, name: "Black L", price: 18.95, variant_id: 106 },
    ],
    2: [
      { id: 201, name: "White 11oz", price: 12.95, variant_id: 201 },
      { id: 202, name: "Black 11oz", price: 12.95, variant_id: 202 },
    ],
    3: [
      { id: 301, name: "18x24", price: 19.95, variant_id: 301 },
      { id: 302, name: "24x36", price: 29.95, variant_id: 302 },
    ],
    4: [
      { id: 401, name: "3x3", price: 3.95, variant_id: 401 },
      { id: 402, name: "5x5", price: 5.95, variant_id: 402 },
    ],
    5: [
      { id: 501, name: "Gray S", price: 34.95, variant_id: 501 },
      { id: 502, name: "Gray M", price: 34.95, variant_id: 502 },
      { id: 503, name: "Gray L", price: 34.95, variant_id: 503 },
      { id: 504, name: "Black S", price: 34.95, variant_id: 504 },
      { id: 505, name: "Black M", price: 34.95, variant_id: 505 },
      { id: 506, name: "Black L", price: 34.95, variant_id: 506 },
    ],
  };

  return variantsByProduct[productId] || [];
};

/**
 * Mock create product
 * @param {Object} productData - Product data
 * @returns {Object} Mock created product
 */
const mockCreateProduct = (productData) => {
  const mockId = Date.now();

  return {
    id: mockId,
    name: productData.name,
    external_id: productData.externalId || `product_${mockId}`,
    sync_product: {
      id: mockId,
      name: productData.name,
      thumbnail_url: productData.imageUrl,
    },
    sync_variants: [
      {
        id: mockId + 1,
        product_id: mockId,
        name: `${productData.name} Default`,
        retail_price: "25.00", // Default price
        variant_id: productData.variantId,
        external_id: `variant_${mockId}_1`,
        files: [
          {
            id: mockId + 100,
            type: "default",
            url: productData.imageUrl,
          },
        ],
      },
    ],
    thumbnail_url: productData.imageUrl,
    is_ignored: false,
  };
};

/**
 * Mock create order
 * @param {Object} orderData - Order data
 * @returns {Object} Mock created order
 */
const mockCreateOrder = (orderData) => {
  const mockId = Date.now();
  return {
    id: mockId,
    external_id: `order_${mockId}`,
    status: "pending",
    shipping: "STANDARD",
    shipping_service_name: "Standard shipping",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    recipient: {
      name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      address1: orderData.shippingAddress.street,
      city: orderData.shippingAddress.city,
      state_code: orderData.shippingAddress.state,
      country_code: orderData.shippingAddress.country,
      zip: orderData.shippingAddress.postalCode,
      email: orderData.email,
      phone: orderData.phone,
    },
    items: orderData.items.map((item, index) => ({
      id: mockId + index + 1,
      external_id: `item_${mockId}_${index}`,
      variant_id: item.printfulVariantId,
      quantity: item.quantity,
      price: item.price.toString(),
      retail_price: item.price.toString(),
      name: `Mock Item ${index + 1}`,
      files: [
        {
          id: mockId + 100 + index,
          type: "default",
          url: "https://example.com/mockImage.jpg",
        },
      ],
    })),
    costs: {
      subtotal: orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      shipping: 7.95,
      tax: 0,
      total:
        orderData.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ) + 7.95,
    },
  };
};

/**
 * Mock shipping rates
 * @returns {Array} Mock shipping rates
 */
const mockShippingRates = () => {
  return [
    {
      id: "STANDARD",
      name: "Standard shipping",
      rate: 7.95,
      currency: "USD",
      minDeliveryDays: 4,
      maxDeliveryDays: 6,
    },
    {
      id: "EXPRESS",
      name: "Express shipping",
      rate: 14.95,
      currency: "USD",
      minDeliveryDays: 2,
      maxDeliveryDays: 3,
    },
  ];
};

/**
 * Mock production costs
 * @param {String} variantId - Variant ID
 * @returns {Object} Mock production costs
 */
const mockProductionCosts = (variantId) => {
  // Base costs for different categories
  const baseCosts = {
    // T-shirts (IDs 101-106)
    101: 9.95,
    102: 9.95,
    103: 9.95,
    104: 9.95,
    105: 9.95,
    106: 9.95,
    // Mugs (IDs 201-202)
    201: 5.95,
    202: 5.95,
    // Posters (IDs 301-302)
    301: 8.95,
    302: 12.95,
    // Stickers (IDs 401-402)
    401: 1.95,
    402: 2.95,
    // Hoodies (IDs 501-506)
    501: 19.95,
    502: 19.95,
    503: 19.95,
    504: 19.95,
    505: 19.95,
    506: 19.95,
  };

  return {
    variantId,
    productionCost: baseCosts[variantId.toString()] || 10.0,
  };
};

/**
 * Mock order status
 * @param {String} orderId - Order ID
 * @returns {Object} Mock order status
 */
const mockOrderStatus = (orderId) => {
  // Randomly select a status for demo purposes
  const statuses = [
    "pending",
    "processing",
    "fulfilled",
    "shipped",
    "delivered",
  ];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: orderId,
    external_id: `order_${orderId}`,
    status: randomStatus,
    shipping: "STANDARD",
    created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated: new Date().toISOString(),
    shipping_service_name: "Standard shipping",
    recipient: {
      name: "John Doe",
      address1: "123 Main St",
      city: "Anytown",
      state_code: "CA",
      country_code: "US",
      zip: "12345",
    },
    items: [
      {
        id: orderId + 1,
        external_id: `item_${orderId}_1`,
        variant_id: 101,
        quantity: 1,
        price: "18.95",
        retail_price: "18.95",
        name: "Mock T-Shirt",
        status: randomStatus,
      },
    ],
    tracking_number:
      randomStatus === "shipped" || randomStatus === "delivered"
        ? "MOCK123456789"
        : null,
    tracking_url:
      randomStatus === "shipped" || randomStatus === "delivered"
        ? "https://example.com/tracking/MOCK123456789"
        : null,
  };
};

module.exports = {
  getProducts,
  getProductVariants,
  createProduct,
  createOrder,
  calculateShipping,
  getProductionCosts,
  getOrderStatus,
  cancelOrder,
};
