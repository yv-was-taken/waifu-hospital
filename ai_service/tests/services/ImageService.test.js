const { faker } = require('@faker-js/faker');

// Mock OpenAI - must be declared before imports
const mockImageGenerate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    images: {
      generate: mockImageGenerate
    }
  }))
}));

const ImageService = require('../../services/ImageService');

describe('ImageService', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.OPENAI_IMAGE_API_KEY = 'test-image-api-key';
  });

  describe('generateImage', () => {
    const mockParams = {
      description: faker.lorem.paragraph(),
      personality: faker.lorem.sentence(),
      style: 'anime'
    };

    it('should generate image successfully', async () => {
      const mockImageUrl = faker.image.url();
      
      mockImageGenerate.mockResolvedValue({
        data: [{ url: mockImageUrl }]
      });

      const result = await ImageService.generateImage(mockParams);

      expect(mockImageGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: expect.any(String),
        n: 1,
        size: '1024x1024'
      });
      expect(result).toBe(mockImageUrl);
    });

    it('should return fallback image on API error', async () => {
      mockImageGenerate.mockRejectedValue(new Error('API Error'));

      const result = await ImageService.generateImage(mockParams);

      // Should return one of the fallback URLs
      expect(result).toContain('pinimg.com');
    });

    it('should call createImagePrompt with correct parameters', async () => {
      const mockImageUrl = faker.image.url();
      
      mockImageGenerate.mockResolvedValue({
        data: [{ url: mockImageUrl }]
      });

      // Spy on createImagePrompt method
      const createImagePromptSpy = jest.spyOn(ImageService, 'createImagePrompt');

      await ImageService.generateImage(mockParams);

      expect(createImagePromptSpy).toHaveBeenCalledWith(mockParams);
    });

    it('should handle different styles', async () => {
      const styles = ['anime', 'retro', 'gothic', 'neocyber', 'fantasy', 'sci-fi', 'chibi'];
      const mockImageUrl = faker.image.url();
      
      mockImageGenerate.mockResolvedValue({
        data: [{ url: mockImageUrl }]
      });

      for (const style of styles) {
        const params = { ...mockParams, style };
        const result = await ImageService.generateImage(params);
        expect(result).toBe(mockImageUrl);
      }

      expect(mockImageGenerate).toHaveBeenCalledTimes(styles.length);
    });

    it('should handle missing personality gracefully', async () => {
      const paramsWithoutPersonality = {
        description: faker.lorem.paragraph(),
        style: 'anime'
      };
      const mockImageUrl = faker.image.url();
      
      mockImageGenerate.mockResolvedValue({
        data: [{ url: mockImageUrl }]
      });

      const result = await ImageService.generateImage(paramsWithoutPersonality);

      expect(result).toBe(mockImageUrl);
    });
  });

  describe('createImagePrompt', () => {
    const mockParams = {
      description: 'beautiful girl with long hair',
      personality: 'cheerful and energetic',
      style: 'anime'
    };

    it('should create prompt with all components', () => {
      const prompt = ImageService.createImagePrompt(mockParams);

      expect(prompt).toContain('high-quality anime girl character portrait');
      expect(prompt).toContain(mockParams.description);
      expect(prompt).toContain(mockParams.personality);
      expect(prompt).toContain('Japanese anime art style');
    });

    it('should include style-specific guidelines for anime', () => {
      const prompt = ImageService.createImagePrompt(mockParams);

      expect(prompt).toContain('Japanese anime art style');
      expect(prompt).toContain('clean lines');
      expect(prompt).toContain('vibrant colors');
      expect(prompt).toContain('large expressive eyes');
    });

    it('should include style-specific guidelines for retro', () => {
      const params = { ...mockParams, style: 'retro' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('80s-90s classic anime style');
      expect(prompt).toContain('vintage color palette');
      expect(prompt).toContain('Sailor uniform');
      expect(prompt).toContain('shoujo manga');
    });

    it('should include style-specific guidelines for gothic', () => {
      const params = { ...mockParams, style: 'gothic' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Gothic lolita');
      expect(prompt).toContain('Victorian-inspired');
      expect(prompt).toContain('black and dark purple');
      expect(prompt).toContain('melancholic expression');
    });

    it('should include style-specific guidelines for neocyber', () => {
      const params = { ...mockParams, style: 'neocyber' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Cyberpunk anime girl');
      expect(prompt).toContain('neon-colored hair');
      expect(prompt).toContain('futuristic fashion');
      expect(prompt).toContain('Ghost in the Shell');
    });

    it('should include style-specific guidelines for fantasy', () => {
      const params = { ...mockParams, style: 'fantasy' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Magical anime girl');
      expect(prompt).toContain('ethereal dress');
      expect(prompt).toContain('mystical accessories');
      expect(prompt).toContain('fairy-like');
    });

    it('should include style-specific guidelines for sci-fi', () => {
      const params = { ...mockParams, style: 'sci-fi' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Futuristic anime girl');
      expect(prompt).toContain('pilot suit');
      expect(prompt).toContain('high-tech armor');
      expect(prompt).toContain('Evangelion');
    });

    it('should include style-specific guidelines for chibi', () => {
      const params = { ...mockParams, style: 'chibi' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Ultra-cute chibi');
      expect(prompt).toContain('exaggerated kawaii');
      expect(prompt).toContain('large head and eyes');
      expect(prompt).toContain('moe art style');
    });

    it('should default to anime style for unknown styles', () => {
      const params = { ...mockParams, style: 'unknown-style' };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain('Japanese anime art style');
    });

    it('should handle missing personality', () => {
      const params = {
        description: mockParams.description,
        style: mockParams.style
      };
      const prompt = ImageService.createImagePrompt(params);

      expect(prompt).toContain(mockParams.description);
      expect(prompt).not.toContain('personality is undefined');
    });

    it('should include quality specifications', () => {
      const prompt = ImageService.createImagePrompt(mockParams);

      expect(prompt).toContain('extremely high detail');
      expect(prompt).toContain('professional illustration quality');
      expect(prompt).toContain('8k resolution quality');
      expect(prompt).toContain('ONLY ONE girl character');
      expect(prompt).toContain('No text, watermarks, or signatures');
    });

    it('should include composition guidelines', () => {
      const prompt = ImageService.createImagePrompt(mockParams);

      expect(prompt).toContain('upper body focus');
      expect(prompt).toContain('centered composition');
      expect(prompt).toContain('strong depth of field');
      expect(prompt).toContain('perfect composition');
    });

    it('should reflect personality in visual elements', () => {
      const prompt = ImageService.createImagePrompt(mockParams);

      expect(prompt).toContain('reflected in their facial expression, pose, and body language');
    });
  });

  describe('getFallbackImage', () => {
    it('should return anime fallback image for anime style', () => {
      const result = ImageService.getFallbackImage('anime');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('a11ac53d6c37a8f3ed2cf9afbe9e5e0a');
    });

    it('should return retro fallback image for retro style', () => {
      const result = ImageService.getFallbackImage('retro');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('0a53c2a681df11c0e2f70d80a9a6c289');
    });

    it('should return gothic fallback image for gothic style', () => {
      const result = ImageService.getFallbackImage('gothic');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('8e0d5790a4644ab4c93c5f3b953fcc0c');
    });

    it('should return neocyber fallback image for neocyber style', () => {
      const result = ImageService.getFallbackImage('neocyber');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('bd57a33e4ee9e67671b8c7ff6b75cda1');
    });

    it('should return realistic fallback image for realistic style', () => {
      const result = ImageService.getFallbackImage('realistic');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('11973e4b0efb0c36af1a1af54c2357f6');
    });

    it('should return fantasy fallback image for fantasy style', () => {
      const result = ImageService.getFallbackImage('fantasy');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('c30c1320b64f4a13e1046b2d7b5c4a7a');
    });

    it('should return sci-fi fallback image for sci-fi style', () => {
      const result = ImageService.getFallbackImage('sci-fi');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('a15210aa82e5385bd190c0e2dd0a9281');
    });

    it('should return chibi fallback image for chibi style', () => {
      const result = ImageService.getFallbackImage('chibi');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('b58680b0d06c752b0d3f3e6e5ea47c04');
    });

    it('should return anime fallback for unknown style', () => {
      const result = ImageService.getFallbackImage('unknown-style');
      expect(result).toContain('pinimg.com');
      expect(result).toContain('a11ac53d6c37a8f3ed2cf9afbe9e5e0a');
    });

    it('should return anime fallback for null style', () => {
      const result = ImageService.getFallbackImage(null);
      expect(result).toContain('pinimg.com');
      expect(result).toContain('a11ac53d6c37a8f3ed2cf9afbe9e5e0a');
    });

    it('should return anime fallback for undefined style', () => {
      const result = ImageService.getFallbackImage(undefined);
      expect(result).toContain('pinimg.com');
      expect(result).toContain('a11ac53d6c37a8f3ed2cf9afbe9e5e0a');
    });
  });

  describe('Error Handling', () => {
    const mockParams = {
      description: faker.lorem.paragraph(),
      personality: faker.lorem.sentence(),
      style: 'anime'
    };

    it('should handle OpenAI API authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockImageGenerate.mockRejectedValue(authError);

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });

    it('should handle OpenAI API rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' }
      };
      mockImageGenerate.mockRejectedValue(rateLimitError);

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });

    it('should handle OpenAI API server errors', async () => {
      const serverError = new Error('Internal server error');
      serverError.response = {
        status: 500,
        data: { error: 'Internal server error' }
      };
      mockImageGenerate.mockRejectedValue(serverError);

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ECONNABORTED';
      mockImageGenerate.mockRejectedValue(timeoutError);

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });

    it('should handle malformed API responses', async () => {
      mockImageGenerate.mockResolvedValue({
        data: [] // Empty data array
      });

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });

    it('should handle missing response data', async () => {
      mockImageGenerate.mockResolvedValue({
        // Missing data property
      });

      const result = await ImageService.generateImage(mockParams);

      expect(result).toContain('pinimg.com');
    });
  });

  describe('Integration', () => {
    it('should create different prompts for different styles', () => {
      const baseParams = {
        description: 'girl with blue hair',
        personality: 'mysterious',
      };

      const animePrompt = ImageService.createImagePrompt({ ...baseParams, style: 'anime' });
      const gothicPrompt = ImageService.createImagePrompt({ ...baseParams, style: 'gothic' });
      const chibiPrompt = ImageService.createImagePrompt({ ...baseParams, style: 'chibi' });

      expect(animePrompt).not.toBe(gothicPrompt);
      expect(gothicPrompt).not.toBe(chibiPrompt);
      expect(animePrompt).not.toBe(chibiPrompt);

      // All should contain base elements
      [animePrompt, gothicPrompt, chibiPrompt].forEach(prompt => {
        expect(prompt).toContain('girl with blue hair');
        expect(prompt).toContain('mysterious');
      });
    });

    it('should handle edge case parameters', () => {
      const edgeCaseParams = {
        description: '',
        personality: '',
        style: ''
      };

      const prompt = ImageService.createImagePrompt(edgeCaseParams);
      
      expect(prompt).toContain('high-quality anime girl character portrait');
      expect(prompt).toContain('Japanese anime art style'); // Default style
    });
  });
});