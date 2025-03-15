import axios from "axios";

// Get the API URL from environment variable or use container name as fallback
const API_URL = process.env.REACT_APP_API_URL || "http://backend:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the API URL for debugging
console.log("API URL:", API_URL);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Generate product mockups using Printful API
 * @param {string} imageUrl - URL of the character image to place on products
 * @param {Object} product - Product to generate mockups for (with variantId, category, etc.)
 * @returns {Promise} Promise resolving to mockup data
 */
export const generateProductMockups = async (imageUrl, product) => {
  try {
    const response = await api.post("/api/merchandise/generate-mockups", {
      imageUrl,
      product,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating mockups:", error);
    throw error;
  }
};

export default api;
