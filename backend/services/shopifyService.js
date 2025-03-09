// Mock Shopify service to avoid dependencies on Shopify API during development
// This allows the app to start without Shopify credentials configured
const dotenv = require("dotenv");

dotenv.config();

// Create a mock shopify object that implements the required methods
const shopify = {
  session: {
    customAppSession: async () => {
      return { id: "mock-session" };
    },
  },
  clients: {
    Rest: () => {},
  },
};

/**
 * Create a new product in Shopify
 * @param {Object} merchandiseData - The merchandise data
 * @returns {Object} The created Shopify product
 */
const createProduct = async (merchandiseData) => {
  try {
    // Check if Shopify API key is set, if not return mock data
    if (
      !process.env.SHOPIFY_API_KEY ||
      process.env.SHOPIFY_API_KEY === "dummy_key"
    ) {
      console.warn(
        "Shopify integration not properly configured. Returning mock product data.",
      );
      return {
        id: `mock_${Date.now()}`,
        title: merchandiseData.name,
        handle: merchandiseData.name.toLowerCase().replace(/\s+/g, "-"),
        images: [{ src: merchandiseData.image }],
        variants: [{ id: `mock_variant_${Date.now()}` }],
      };
    }

    const session = await shopify.session.customAppSession(
      process.env.SHOPIFY_SHOP || "dummy-shop.myshopify.com",
    );

    const client = new shopify.clients.Rest({ session });

    // Format the product data for Shopify
    const shopifyProduct = {
      product: {
        title: merchandiseData.name,
        body_html: merchandiseData.description,
        vendor: "Waifu Hospital",
        product_type: merchandiseData.category,
        images: [
          {
            src: merchandiseData.image,
          },
        ],
        variants: generateVariants(merchandiseData),
      },
    };

    const response = await client.post({
      path: "products",
      data: shopifyProduct,
    });

    return response.body.product;
  } catch (error) {
    console.error("Error creating Shopify product:", error);
    // Return mock data on error instead of throwing
    return {
      id: `mock_${Date.now()}`,
      title: merchandiseData.name,
      handle: merchandiseData.name.toLowerCase().replace(/\s+/g, "-"),
      images: [{ src: merchandiseData.image }],
      variants: [{ id: `mock_variant_${Date.now()}` }],
    };
  }
};

/**
 * Generate product variants based on sizes and colors
 * @param {Object} merchandiseData - The merchandise data
 * @returns {Array} Array of variant objects
 */
const generateVariants = (merchandiseData) => {
  const variants = [];

  // If no sizes or colors, create a single variant
  if (!merchandiseData.sizes?.length && !merchandiseData.colors?.length) {
    return [
      {
        price: merchandiseData.price,
        inventory_quantity: merchandiseData.stock,
        requires_shipping: true,
      },
    ];
  }

  // Create variants for each size and color combination
  const sizes = merchandiseData.sizes?.length
    ? merchandiseData.sizes
    : ["Default"];
  const colors = merchandiseData.colors?.length
    ? merchandiseData.colors
    : ["Default"];

  for (const size of sizes) {
    for (const color of colors) {
      variants.push({
        price: merchandiseData.price,
        option1: size !== "Default" ? size : null,
        option2: color !== "Default" ? color : null,
        inventory_quantity: merchandiseData.stock,
        requires_shipping: true,
      });
    }
  }

  return variants;
};

/**
 * Get a Shopify product by ID
 * @param {String} productId - The Shopify product ID
 * @returns {Object} The Shopify product
 */
const getProduct = async (productId) => {
  try {
    // Check if Shopify API key is set, if not return mock data
    if (
      !process.env.SHOPIFY_API_KEY ||
      process.env.SHOPIFY_API_KEY === "dummy_key"
    ) {
      console.warn(
        "Shopify integration not properly configured. Returning mock product data.",
      );
      return {
        id: productId,
        title: "Mock Product",
        handle: "mock-product",
        images: [{ src: "https://example.com/mock-image.jpg" }],
        variants: [{ id: `mock_variant_${Date.now()}` }],
      };
    }

    const session = await shopify.session.customAppSession(
      process.env.SHOPIFY_SHOP || "dummy-shop.myshopify.com",
    );
    const client = new shopify.clients.Rest({ session });

    const response = await client.get({
      path: `products/${productId}`,
    });

    return response.body.product;
  } catch (error) {
    console.error("Error fetching Shopify product:", error);
    // Return mock data on error instead of throwing
    return {
      id: productId,
      title: "Mock Product",
      handle: "mock-product",
      images: [{ src: "https://example.com/mock-image.jpg" }],
      variants: [{ id: `mock_variant_${Date.now()}` }],
    };
  }
};

/**
 * Create a checkout for products
 * @param {Array} lineItems - Array of line items with product ID, variant ID, and quantity
 * @returns {Object} Checkout data including URL
 */
const createCheckout = async (lineItems) => {
  try {
    // Check if Shopify API key is set, if not return mock data
    if (
      !process.env.SHOPIFY_API_KEY ||
      process.env.SHOPIFY_API_KEY === "dummy_key"
    ) {
      console.warn(
        "Shopify integration not properly configured. Returning mock checkout data.",
      );
      return {
        id: `mock_checkout_${Date.now()}`,
        web_url: "https://example.com/mock-checkout",
        line_items: lineItems,
      };
    }

    const session = await shopify.session.customAppSession(
      process.env.SHOPIFY_SHOP || "dummy-shop.myshopify.com",
    );
    const client = new shopify.clients.Rest({ session });

    const checkoutData = {
      checkout: {
        line_items: lineItems,
        presentment_currency: "USD",
      },
    };

    const response = await client.post({
      path: "checkouts",
      data: checkoutData,
    });

    return response.body.checkout;
  } catch (error) {
    console.error("Error creating Shopify checkout:", error);
    // Return mock data on error instead of throwing
    return {
      id: `mock_checkout_${Date.now()}`,
      web_url: "https://example.com/mock-checkout",
      line_items: lineItems,
    };
  }
};

module.exports = {
  createProduct,
  getProduct,
  createCheckout,
};
