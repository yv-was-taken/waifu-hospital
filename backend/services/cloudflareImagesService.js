const axios = require("axios");
const FormData = require("form-data");
const logger = require("../utils/logger");

/**
 * Service for interacting with Cloudflare Images API
 */
class CloudflareImagesService {
  constructor() {
    this.apiKey = process.env.CLOUDFLARE_IMAGES_API_KEY;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "your-account-id"; // Should be configured in .env
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
    this.deliveryUrl = `https://imagedelivery.net/${this.accountId}`; // Adjust as needed
  }

  /**
   * Upload an image to Cloudflare Images from a URL
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} metadata - Optional metadata for the image (like characterId)
   * @returns {Promise<Object>} The uploaded image data
   */
  async uploadImageFromUrl(imageUrl, metadata = {}) {
    logger.debug("Uploading image to Cloudflare Images", { imageUrl });

    try {
      // First, fetch the image from the provided URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Create form data for upload (using form-data npm package)
      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: `character-${Date.now()}.png`,
        contentType: "image/png",
      });

      // Add metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      // Upload to Cloudflare Images
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
      });

      logger.info("Image uploaded to Cloudflare Images successfully");
      return response.data.result;
    } catch (error) {
      logger.error("Failed to upload image to Cloudflare Images", error);
      throw new Error("Failed to upload image to Cloudflare Images");
    }
  }

  /**
   * Get an image from Cloudflare Images
   * @param {string} imageId - The ID of the image to retrieve
   * @returns {Promise<Object>} The image data
   */
  async getImage(imageId) {
    logger.debug("Retrieving image from Cloudflare Images", { imageId });

    try {
      const response = await axios.get(`${this.baseUrl}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      logger.info("Image retrieved from Cloudflare Images successfully");
      return response.data.result;
    } catch (error) {
      logger.error("Failed to retrieve image from Cloudflare Images", error);
      throw new Error("Failed to retrieve image from Cloudflare Images");
    }
  }

  /**
   * Delete an image from Cloudflare Images
   * @param {string} imageId - The ID of the image to delete
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteImage(imageId) {
    logger.debug("Deleting image from Cloudflare Images", { imageId });

    try {
      await axios.delete(`${this.baseUrl}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      logger.info("Image deleted from Cloudflare Images successfully");
      return true;
    } catch (error) {
      logger.error("Failed to delete image from Cloudflare Images", error);
      throw new Error("Failed to delete image from Cloudflare Images");
    }
  }

  /**
   * Generate a Cloudflare Images URL for a given image ID
   * @param {string} imageId - The ID of the image
   * @param {string} variant - The variant of the image (e.g., 'public', 'avatar')
   * @returns {string} The URL of the image
   */
  getImageUrl(imageId, variant = "public") {
    return `${this.deliveryUrl}/${imageId}/${variant}`;
  }
}

module.exports = new CloudflareImagesService();
