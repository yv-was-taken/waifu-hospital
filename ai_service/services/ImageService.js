const { OpenAI } = require("openai");

/**
 * Service handling AI image generation
 */
class ImageService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_IMAGE_API_KEY,
    });
  }

  /**
   * Generate an image based on character description and style
   *
   * @param {object} params - Image generation parameters
   * @param {string} params.description - Description of the character
   * @param {string} params.personality - Personality traits of the character
   * @param {string} params.style - Visual style (e.g., anime, realistic, etc.)
   * @returns {Promise<string>} The URL of the generated image
   * @throws {Error} If the API call fails
   */
  async generateImage({ description, personality, style }) {
    console.log("Generating image", { description, personality, style });

    // Create a rich prompt based on character details
    const prompt = this.createImagePrompt({ description, personality, style });

    try {
      // Call OpenAI API to generate image
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      console.log("Image generated successfully");
      return response.data[0].url;
    } catch (error) {
      console.error("Failed to generate image", error);
      return this.getFallbackImage(style);
    }
  }

  /**
   * Create a detailed image generation prompt based on character attributes
   */
  createImagePrompt({ description, personality, style }) {
    // Base composition guidelines
    let prompt = `Create a high-quality anime girl character portrait, upper body focus, centered composition. `;

    // Add character description
    prompt += `The character has ${description}. `;

    // Add personality traits to influence visual appearance
    if (personality) {
      prompt += `Their personality is ${personality}, which should be reflected in their facial expression, pose, and body language. `;
    }

    // Style-specific enhancements
    const styleGuides = {
      anime:
        "Japanese anime art style with clean lines, vibrant colors, and large expressive eyes. Semi-realistic proportions, detailed hair with dynamic shading, soft cel-shading technique. High contrast lighting with subtle ambient occlusion.",
      retro:
        "80s-90s classic anime style girl with bold outlines and vintage color palette. Sailor uniform or retro fashion, big sparkly eyes, and detailed hand-drawn style shading. Hair styled in classic anime fashion with vintage shoujo manga aesthetics. Reminiscent of Studio Ghibli or 90s magical girl anime.",
      gothic:
        "Gothic lolita anime girl with Victorian-inspired black and dark purple dress, frilly accessories, and elegant ribbons. Long flowing dark hair with drill curls or straight style. Pale skin, melancholic expression, holding parasol or roses. Dark atmospheric background with gothic architecture elements.",
      neocyber:
        "Cyberpunk anime girl with neon-colored hair highlights and futuristic fashion. Holographic accessories, cyber implants, and glowing tech patterns on clothing. Modern urban night background with neon signs. Reminiscent of Ghost in the Shell or Cyberpunk Edgerunners style.",
      fantasy:
        "Magical anime girl with flowing ethereal dress and mystical accessories. Long flowing hair with magical particles and sparkles. Detailed fantasy outfit with ribbons and ornate decorations. Wielding staff or magical elements, with fairy-like or elvish features. Soft dreamy background with magical elements.",
      "sci-fi":
        "Futuristic anime girl in sleek pilot suit or high-tech armor. Clean, minimalist sci-fi uniform with glowing accents. Short practical or long flowing hair with tech accessories. Holographic displays and mechanical elements in background. Similar to Evangelion or Knights of Sidonia aesthetic.",
      chibi:
        "Ultra-cute chibi anime girl with exaggerated kawaii features. Extra large head and eyes taking up half of face, tiny body. Oversized clothing with cute accessories and pastel colors. Simple moe art style with rounded elements and cheerful expression. Bubbly, cute background elements.",
    };

    // Add style-specific guidance
    prompt += styleGuides[style] || styleGuides.anime;

    // Quality and technical specifications
    prompt +=
      " Render in extremely high detail with professional illustration quality. Use strong depth of field, perfect composition, and masterful color theory. Ensure 8k resolution quality, professional lighting, and ray-traced shadows. IMPORTANT: Generate ONLY ONE girl character - no additional characters, no multiple faces, and no split personalities in the same image. No text, watermarks, or signatures. Full character visibility with clean background elements.";

    return prompt;
  }

  /**
   * Get a fallback image when AI generation fails
   * @param {string} style - The requested image style
   * @returns {string} URL of a fallback image
   */
  getFallbackImage(style) {
    // Fallback placeholder images based on style
    const placeholderImages = {
      anime:
        "https://i.pinimg.com/736x/a1/1a/c5/a11ac53d6c37a8f3ed2cf9afbe9e5e0a.jpg",
      retro:
        "https://i.pinimg.com/564x/0a/53/c2/0a53c2a681df11c0e2f70d80a9a6c289.jpg",
      gothic:
        "https://i.pinimg.com/564x/8e/0d/57/8e0d5790a4644ab4c93c5f3b953fcc0c.jpg",
      neocyber:
        "https://i.pinimg.com/564x/bd/57/a3/bd57a33e4ee9e67671b8c7ff6b75cda1.jpg",
      realistic:
        "https://i.pinimg.com/564x/11/97/3e/11973e4b0efb0c36af1a1af54c2357f6.jpg",
      fantasy:
        "https://i.pinimg.com/564x/c3/0c/13/c30c1320b64f4a13e1046b2d7b5c4a7a.jpg",
      "sci-fi":
        "https://i.pinimg.com/564x/a1/52/10/a15210aa82e5385bd190c0e2dd0a9281.jpg",
      chibi:
        "https://i.pinimg.com/564x/b5/86/80/b58680b0d06c752b0d3f3e6e5ea47c04.jpg",
    };

    console.log("Using fallback image", { style });
    return placeholderImages[style] || placeholderImages.anime;
  }
}

module.exports = new ImageService();
