const axios = require("axios");
const dotenv = require("dotenv");
const {
  PRODUCT_IDS_BY_CATEGORY,
  VARIANT_IDS,
  VARIANT_IDS_BY_PRODUCT_ID,
} = require("../constants");

dotenv.config();

// Configure Printful API client
const PRINTFUL_STORE_API_KEY =
  process.env.PRINTFUL_STORE_API_KEY || "dummy_printful_key";
const PRINTFUL_API_URL = "https://api.printful.com";

// Configure axios instance for Printful API
const printfulClient = axios.create({
  baseURL: PRINTFUL_API_URL,
  headers: {
    Authorization: `Bearer ${PRINTFUL_STORE_API_KEY}`,
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
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

/**
 * Generate mockup for a product using Printful's Mockup Generator API
 * @param {Object} mockupData - Data for generating the mockup
 * @returns {Promise<Object>} Mockup task result
 */
const generateMockup = async (mockupData) => {
  console.log("\n generating mockup..");
  try {
    // For development without API key
    if (PRINTFUL_STORE_API_KEY === "dummy_printful_key") {
      return mockGenerateMockup(mockupData);
    }

    const { imageUrl, position = "front", category } = mockupData;

    const productId = PRODUCT_IDS_BY_CATEGORY[category];
    const variantIdsForProduct = VARIANT_IDS_BY_PRODUCT_ID[productId];

    const requestData = {
      variant_ids: variantIdsForProduct,
      format: "png",
      product_options: {
        lifelike: true,
      },
      files: [
        {
          placement: position,
          image_url: imageUrl,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 1800,
            top: 300,
            left: 0,
          },
        },
      ],
    };

    console.log("starting mockup generation... fetching taskKey");
    //console.log('request data: ', JSON.stringify(requestData))
    // Start the mockup generation task
    const createTaskResponse = await printfulClient.post(
      `/mockup-generator/create-task/${productId}`,
      requestData,
    );
    console.log("mockGenerator task creation response: ", createTaskResponse);
    const taskKey = createTaskResponse.data.result.task_key;
    console.log("mockup generation task started. task key: ", taskKey);

    // Poll for task completion
    const mockupResult = await pollMockupTask(taskKey);

    console.log("\nmockup generation successful ");
    //console.log("mockup generation result: ", mockupResult)

    return mockupResult;
  } catch (error) {
    console.error("Error generating mockup:", error);
    return null; //mockGenerateMockup(mockupData);
  }
};

/**
 * Poll the mockup generation task until it completes
 * @param {String} taskKey - Task key from the create-task response
 * @returns {Promise<Object>} Mockup result
 */
const pollMockupTask = async (taskKey) => {
  const maxAttempts = 3;
  //according to printful docs, min wait time is 10 seconds
  const delayMs = 10001;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await printfulClient.get(
        `/mockup-generator/task?task_key=${taskKey}`,
      );
      const result = response.data.result;

      if (result.status === "completed") {
        console.log("mockup generation successful");
        return result;
      } else if (result.status === "failed") {
        throw new Error(`Mockup generation failed: ${result.error}`);
      }

      // Wait before trying again
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(
        `Error polling mockup task (attempt ${attempt + 1}):`,
        error.message,
      );
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("Mockup generation timed out");
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
  generateMockup,
};
