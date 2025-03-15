const axios = require("axios");
const FormData = require("form-data");

/**
 * Service for interacting with Cloudflare Images API
 * Based on Cloudflare Images documentation: https://developers.cloudflare.com/images/
 */
class CloudflareImagesService {
  constructor() {
    this.apiKey = process.env.CLOUDFLARE_IMAGES_API_KEY;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH; // Add account hash for delivery URLs

    if (!this.accountId) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_ID is not set. Image uploads will fail.",
      );
    }

    if (!this.apiKey) {
      throw new Error(
        "CLOUDFLARE_IMAGES_API_KEY is not set. Image uploads will fail.",
      );
    }

    if (!this.accountHash) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_HASH is not set. Image delivery will fail.",
      );
    }

    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;

    // The account hash is used in the delivery URL per Cloudflare docs
    // This is different from the account ID used for API calls
    this.deliveryUrl = "https://imagedelivery.net";
  }

  /**
   * Upload an image to Cloudflare Images from a URL
   * @param {string} imageUrl - URL of the image to upload
   * @param {Object} metadata - Optional metadata for the image (like characterId)
   * @returns {Promise<Object>} The uploaded image data
   */
  async uploadImageFromUrl(imageUrl, metadata = {}) {
    if (!this.accountId || !this.apiKey) {
      console.error("Cloudflare account ID or API key not configured");
      throw new Error("Cloudflare account ID or API key not configured");
    }

    console.log("Uploading image to Cloudflare Images", { imageUrl });

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

      // According to Cloudflare docs, we need to set requireSignedURLs if needed
      formData.append("requireSignedURLs", "false");

      // Upload to Cloudflare Images
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.errors?.[0]?.message || "Cloudflare API error",
        );
      }

      console.log("Image uploaded to Cloudflare Images successfully", {
        id: response.data.result.id,
      });
      return response.data.result;
    } catch (error) {
      console.error(
        "Failed to upload image to Cloudflare Images",
        error.response?.data || error.message,
      );
      //@TODO should return object (like null) indicating error uploading...
      //then handled on frontend in production. this is fine for now in development
      throw new Error("Failed to upload image to Cloudflare Images");
    }
  }

  /**
   * Get an image from Cloudflare Images
   * @param {string} imageId - The ID of the image to retrieve
   * @returns {Promise<Object>} The image data
   */
  async getImage(imageId) {
    if (!this.accountId || !this.apiKey) {
      console.error("Cloudflare account ID or API key not configured");
      throw new Error("Cloudflare account ID or API key not configured");
    }

    console.log("Retrieving image from Cloudflare Images", { imageId });

    try {
      const response = await axios.get(`${this.baseUrl}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.errors?.[0]?.message || "Cloudflare API error",
        );
      }

      console.log("Image retrieved from Cloudflare Images successfully");
      return response.data.result;
    } catch (error) {
      console.error(
        "Failed to retrieve image from Cloudflare Images",
        error.response?.data || error.message,
      );
      //@TODO should return object (like null) indicating error uploading...
      //then handled on frontend in production. this is fine for now in development
      throw new Error("Failed to retrieve image from Cloudflare Images");
    }
  }

  /**
   * Delete an image from Cloudflare Images
   * @param {string} imageId - The ID of the image to delete
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deleteImage(imageId) {
    if (!this.accountId || !this.apiKey) {
      console.error("Cloudflare account ID or API key not configured");
      throw new Error("Cloudflare account ID or API key not configured");
    }

    console.log("Deleting image from Cloudflare Images", { imageId });

    try {
      const response = await axios.delete(`${this.baseUrl}/${imageId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.data.success) {
        throw new Error(
          response.data.errors?.[0]?.message || "Cloudflare API error",
        );
      }

      console.log("Image deleted from Cloudflare Images successfully");
      return true;
    } catch (error) {
      console.error(
        "Failed to delete image from Cloudflare Images",
        error.response?.data || error.message,
      );
      //@TODO should return object (like null) indicating error uploading...
      //then handled on frontend in production. this is fine for now in development
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
    // Per Cloudflare docs: https://developers.cloudflare.com/images/cloudflare-images/serve-images/
    // URL format is: https://imagedelivery.net/<accountHash>/<imageId>/<variant>
    // Note: accountHash is different from accountId - it's specifically for delivery URLs
    return `${this.deliveryUrl}/${this.accountHash}/${imageId}/${variant}`;
  }
}

module.exports = new CloudflareImagesService();
