const cloudflareImagesService = require('../../../services/cloudflareImagesService');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

// Mock form-data properly
const mockFormData = {
  append: jest.fn(),
  getHeaders: jest.fn(() => ({ 'content-type': 'multipart/form-data' })),
};

jest.mock('form-data', () => {
  return jest.fn(() => mockFormData);
});

// Mock axios
jest.mock('axios');

describe('Cloudflare Images Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id';
    process.env.CLOUDFLARE_ACCOUNT_HASH = 'test-account-hash';
    process.env.CLOUDFLARE_IMAGES_API_KEY = 'test-api-key';
  });

  describe('uploadImageFromUrl', () => {
    it('should upload image from URL successfully', async () => {
      const imageUrl = faker.image.url();
      const metadata = { characterId: faker.database.mongodbObjectId() };
      
      const mockResponse = {
        data: {
          success: true,
          result: {
            id: 'cloudflare-image-id-123',
            filename: 'test-image.jpg',
            uploaded: new Date().toISOString(),
            requireSignedURLs: false,
            variants: ['https://imagedelivery.net/test-hash/cloudflare-image-id-123/public']
          }
        }
      };

      // Use the globally mocked FormData
      mockFormData.append.mockClear();
      axios.post.mockResolvedValue(mockResponse);

      const result = await cloudflareImagesService.uploadImageFromUrl(imageUrl, metadata);

      expect(require('form-data')).toHaveBeenCalled();
      expect(mockFormData.append).toHaveBeenCalledWith('url', imageUrl);
      expect(mockFormData.append).toHaveBeenCalledWith('metadata', JSON.stringify(metadata));
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/test-account-id/images/v1'),
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      expect(result).toEqual(mockResponse.data.result);
    });

    it('should handle upload errors', async () => {
      const imageUrl = faker.image.url();
      const metadata = { characterId: faker.database.mongodbObjectId() };

      const mockFormData = {
        append: jest.fn()
      };

      FormData.mockImplementation(() => mockFormData);
      axios.post.mockRejectedValue(new Error('Upload failed'));

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl, metadata))
        .rejects.toThrow('Upload failed');
    });

    it('should handle Cloudflare API errors', async () => {
      const imageUrl = faker.image.url();
      const metadata = { characterId: faker.database.mongodbObjectId() };

      const mockResponse = {
        data: {
          success: false,
          errors: ['Invalid image URL']
        }
      };

      // Use the globally mocked FormData
      mockFormData.append.mockClear();
      axios.post.mockResolvedValue(mockResponse);

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl, metadata))
        .rejects.toThrow('Invalid image URL');
    });

    it('should handle missing environment variables', async () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;

      const imageUrl = faker.image.url();
      const metadata = { characterId: faker.database.mongodbObjectId() };

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl, metadata))
        .rejects.toThrow('Missing required Cloudflare configuration');
    });
  });

  describe('uploadImageFromFile', () => {
    it('should upload image from file buffer successfully', async () => {
      const fileBuffer = Buffer.from('fake-image-data');
      const filename = 'test-image.jpg';
      const metadata = { characterId: faker.database.mongodbObjectId() };

      const mockResponse = {
        data: {
          success: true,
          result: {
            id: 'cloudflare-image-id-456',
            filename: filename,
            uploaded: new Date().toISOString()
          }
        }
      };

      // Use the globally mocked FormData
      mockFormData.append.mockClear();
      axios.post.mockResolvedValue(mockResponse);

      const result = await cloudflareImagesService.uploadImageFromFile(fileBuffer, filename, metadata);

      expect(mockFormData.append).toHaveBeenCalledWith('file', fileBuffer, filename);
      expect(mockFormData.append).toHaveBeenCalledWith('metadata', JSON.stringify(metadata));
      expect(result).toEqual(mockResponse.data.result);
    });

    it('should handle file upload errors', async () => {
      const fileBuffer = Buffer.from('fake-image-data');
      const filename = 'test-image.jpg';
      const metadata = { characterId: faker.database.mongodbObjectId() };

      const mockFormData = {
        append: jest.fn()
      };

      FormData.mockImplementation(() => mockFormData);
      axios.post.mockRejectedValue(new Error('File upload failed'));

      await expect(cloudflareImagesService.uploadImageFromFile(fileBuffer, filename, metadata))
        .rejects.toThrow('File upload failed');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const imageId = 'cloudflare-image-id-123';

      const mockResponse = {
        data: {
          success: true,
          result: {}
        }
      };

      axios.delete.mockResolvedValue(mockResponse);

      const result = await cloudflareImagesService.deleteImage(imageId);

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/accounts/test-account-id/images/v1/${imageId}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      expect(result).toEqual(mockResponse.data.result);
    });

    it('should handle delete errors', async () => {
      const imageId = 'cloudflare-image-id-123';

      axios.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(cloudflareImagesService.deleteImage(imageId))
        .rejects.toThrow('Delete failed');
    });

    it('should handle Cloudflare delete API errors', async () => {
      const imageId = 'cloudflare-image-id-123';

      const mockResponse = {
        data: {
          success: false,
          errors: ['Image not found']
        }
      };

      axios.delete.mockResolvedValue(mockResponse);

      await expect(cloudflareImagesService.deleteImage(imageId))
        .rejects.toThrow('Image not found');
    });
  });

  describe('getImageUrl', () => {
    it('should generate correct image URL with default variant', () => {
      const imageId = 'cloudflare-image-id-123';
      
      const url = cloudflareImagesService.getImageUrl(imageId);

      expect(url).toBe(`https://imagedelivery.net/test-account-hash/${imageId}/public`);
    });

    it('should generate image URL with custom variant', () => {
      const imageId = 'cloudflare-image-id-123';
      const variant = 'thumbnail';
      
      const url = cloudflareImagesService.getImageUrl(imageId, variant);

      expect(url).toBe(`https://imagedelivery.net/test-account-hash/${imageId}/${variant}`);
    });

    it('should handle missing account hash', () => {
      delete process.env.CLOUDFLARE_ACCOUNT_HASH;
      
      const imageId = 'cloudflare-image-id-123';
      
      expect(() => cloudflareImagesService.getImageUrl(imageId))
        .toThrow('Missing required Cloudflare configuration');
    });
  });

  describe('getImageInfo', () => {
    it('should get image information successfully', async () => {
      const imageId = 'cloudflare-image-id-123';

      const mockResponse = {
        data: {
          success: true,
          result: {
            id: imageId,
            filename: 'test-image.jpg',
            uploaded: new Date().toISOString(),
            requireSignedURLs: false,
            variants: ['https://imagedelivery.net/test-hash/cloudflare-image-id-123/public'],
            meta: {
              characterId: faker.database.mongodbObjectId()
            }
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await cloudflareImagesService.getImageInfo(imageId);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/accounts/test-account-id/images/v1/${imageId}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      expect(result).toEqual(mockResponse.data.result);
    });

    it('should handle get image info errors', async () => {
      const imageId = 'cloudflare-image-id-123';

      axios.get.mockRejectedValue(new Error('Get info failed'));

      await expect(cloudflareImagesService.getImageInfo(imageId))
        .rejects.toThrow('Get info failed');
    });
  });

  describe('listImages', () => {
    it('should list images successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          result: {
            images: [
              {
                id: 'image-1',
                filename: 'test1.jpg',
                uploaded: new Date().toISOString()
              },
              {
                id: 'image-2',
                filename: 'test2.jpg',
                uploaded: new Date().toISOString()
              }
            ]
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await cloudflareImagesService.listImages();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/test-account-id/images/v1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      expect(result).toEqual(mockResponse.data.result);
    });

    it('should list images with pagination', async () => {
      const page = 2;
      const perPage = 50;

      const mockResponse = {
        data: {
          success: true,
          result: {
            images: []
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await cloudflareImagesService.listImages(page, perPage);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`page=${page}&per_page=${perPage}`),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const imageUrl = faker.image.url();
      const networkError = new Error('Network Error');
      networkError.code = 'ECONNREFUSED';

      const mockFormData = {
        append: jest.fn()
      };

      FormData.mockImplementation(() => mockFormData);
      axios.post.mockRejectedValue(networkError);

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl))
        .rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const imageUrl = faker.image.url();
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';

      const mockFormData = {
        append: jest.fn()
      };

      FormData.mockImplementation(() => mockFormData);
      axios.post.mockRejectedValue(timeoutError);

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl))
        .rejects.toThrow('Timeout');
    });

    it('should handle HTTP error responses', async () => {
      const imageUrl = faker.image.url();
      const httpError = new Error('Request failed with status code 429');
      httpError.response = {
        status: 429,
        data: {
          success: false,
          errors: ['Rate limit exceeded']
        }
      };

      const mockFormData = {
        append: jest.fn()
      };

      FormData.mockImplementation(() => mockFormData);
      axios.post.mockRejectedValue(httpError);

      await expect(cloudflareImagesService.uploadImageFromUrl(imageUrl))
        .rejects.toThrow('Request failed with status code 429');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate all required environment variables', () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
      delete process.env.CLOUDFLARE_ACCOUNT_HASH;
      delete process.env.CLOUDFLARE_IMAGES_API_KEY;

      expect(() => cloudflareImagesService.getImageUrl('test-id'))
        .toThrow('Missing required Cloudflare configuration');
    });

    it('should handle empty environment variables', () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = '';
      process.env.CLOUDFLARE_ACCOUNT_HASH = '';
      process.env.CLOUDFLARE_IMAGES_API_KEY = '';

      expect(() => cloudflareImagesService.getImageUrl('test-id'))
        .toThrow('Missing required Cloudflare configuration');
    });
  });
});