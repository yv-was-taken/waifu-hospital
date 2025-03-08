const Merchandise = require("../models/Merchandise");
const Character = require("../models/Character");
const { validationResult } = require("express-validator");

// Import shopifyService with try/catch to avoid breaking the application if the service is not available
let shopifyService;
try {
  shopifyService = require("../services/shopifyService");
} catch (error) {
  console.warn("Shopify service could not be loaded. Merchandise features will be limited.");
  // Create mock shopify service to prevent errors
  shopifyService = {
    createProduct: async () => ({
      id: `mock_${Date.now()}`,
      handle: 'mock-product'
    }),
    getProduct: async () => ({}),
    createCheckout: async () => ({
      id: 'mock-checkout',
      web_url: 'https://example.com/checkout'
    })
  };
}

// @desc    Create a new merchandise item
// @route   POST /api/merchandise
// @access  Private
exports.createMerchandise = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    description,
    price,
    imageUrl,
    character,
    category,
    availableSizes,
    availableColors,
    stock,
    productionCost,
    creatorRevenue,
  } = req.body;

  try {
    // Check if character exists
    const characterObj = await Character.findById(character);
    if (!characterObj) {
      return res.status(404).json({ msg: "Character not found" });
    }

    // Verify that the user is the creator of the character
    if (characterObj.creator.toString() !== req.user.id) {
      return res.status(401).json({
        msg: "Not authorized to create merchandise for this character",
      });
    }

    // Create new merchandise item in our database
    const newMerchandise = new Merchandise({
      name,
      description,
      price,
      imageUrl,
      character,
      creator: req.user.id,
      category,
      availableSizes: availableSizes || ["N/A"],
      availableColors: availableColors || [],
      stock: stock || 100,
      productionCost,
      creatorRevenue,
    });

    // Create the merchandise in Shopify (with error handling)
    try {
      const shopifyProduct = await shopifyService.createProduct({
        name,
        description,
        price,
        image: imageUrl,
        category,
        sizes: availableSizes || ["N/A"],
        colors: availableColors || [],
        stock: stock || 100
      });
      
      // Store Shopify product ID and other relevant data
      if (shopifyProduct && shopifyProduct.id) {
        newMerchandise.shopifyProductId = shopifyProduct.id;
        
        // Use a default shop URL if environment variable isn't set
        const shopDomain = process.env.SHOPIFY_SHOP || 'example.myshopify.com';
        newMerchandise.shopifyProductUrl = `https://${shopDomain}/products/${shopifyProduct.handle}`;
      }
    } catch (shopifyError) {
      console.error('Shopify product creation failed:', shopifyError);
      // Continue with local save even if Shopify fails
    }

    const merchandise = await newMerchandise.save();

    res.json(merchandise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Character not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Get all merchandise
// @route   GET /api/merchandise
// @access  Public
exports.getMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.find()
      .populate("character", ["name", "imageUrl"])
      .populate("creator", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    res.json(merchandise);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all merchandise for logged in creator
// @route   GET /api/merchandise/creator
// @access  Private
exports.getCreatorMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.find({ creator: req.user.id })
      .populate("character", ["name", "imageUrl"])
      .sort({ createdAt: -1 });

    res.json(merchandise);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all merchandise for a character
// @route   GET /api/merchandise/character/:characterId
// @access  Public
exports.getCharacterMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.find({
      character: req.params.characterId,
    })
      .populate("creator", ["username", "profilePicture"])
      .sort({ createdAt: -1 });

    res.json(merchandise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Character not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Get merchandise by ID
// @route   GET /api/merchandise/:id
// @access  Public
exports.getMerchandiseById = async (req, res) => {
  try {
    const merchandise = await Merchandise.findById(req.params.id)
      .populate("character", ["name", "imageUrl", "description", "personality"])
      .populate("creator", ["username", "profilePicture"]);

    if (!merchandise) {
      return res.status(404).json({ msg: "Merchandise not found" });
    }

    res.json(merchandise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Merchandise not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Update a merchandise item
// @route   PUT /api/merchandise/:id
// @access  Private
exports.updateMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.findById(req.params.id);

    if (!merchandise) {
      return res.status(404).json({ msg: "Merchandise not found" });
    }

    // Check if merchandise belongs to user
    if (merchandise.creator.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Not authorized to update this merchandise" });
    }

    const {
      name,
      description,
      price,
      imageUrl,
      category,
      availableSizes,
      availableColors,
      stock,
      productionCost,
      creatorRevenue,
    } = req.body;

    // Build merchandise object
    const merchandiseFields = {};
    if (name) merchandiseFields.name = name;
    if (description) merchandiseFields.description = description;
    if (price) merchandiseFields.price = price;
    if (imageUrl) merchandiseFields.imageUrl = imageUrl;
    if (category) merchandiseFields.category = category;
    if (availableSizes) merchandiseFields.availableSizes = availableSizes;
    if (availableColors) merchandiseFields.availableColors = availableColors;
    if (stock !== undefined) merchandiseFields.stock = stock;
    if (productionCost) merchandiseFields.productionCost = productionCost;
    if (creatorRevenue) merchandiseFields.creatorRevenue = creatorRevenue;

    // Update merchandise
    const updatedMerchandise = await Merchandise.findByIdAndUpdate(
      req.params.id,
      { $set: merchandiseFields },
      { new: true },
    )
      .populate("character", ["name", "imageUrl"])
      .populate("creator", ["username", "profilePicture"]);

    res.json(updatedMerchandise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Merchandise not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Delete a merchandise item
// @route   DELETE /api/merchandise/:id
// @access  Private
exports.deleteMerchandise = async (req, res) => {
  try {
    const merchandise = await Merchandise.findById(req.params.id);

    if (!merchandise) {
      return res.status(404).json({ msg: "Merchandise not found" });
    }

    // Check if merchandise belongs to user
    if (merchandise.creator.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Not authorized to delete this merchandise" });
    }

    await merchandise.remove();

    res.json({ msg: "Merchandise removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Merchandise not found" });
    }
    res.status(500).send("Server Error");
  }
};

// @desc    Create a Shopify checkout for merchandise items
// @route   POST /api/merchandise/checkout
// @access  Private
exports.createCheckout = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "Items are required" });
    }
    
    // Format line items for Shopify checkout
    const lineItems = [];
    
    for (const item of items) {
      const merchandise = await Merchandise.findById(item.merchandiseId);
      
      if (!merchandise) {
        return res.status(404).json({ 
          msg: `Merchandise not found: ${item.merchandiseId}` 
        });
      }
      
      // Find the variant if size/color specified
      let variantId = null;
      
      if (item.size || item.color) {
        // Only try to find variant if we have shopifyVariants array
        if (merchandise.shopifyVariants && merchandise.shopifyVariants.length > 0) {
          const variant = merchandise.shopifyVariants.find(v => 
            (!item.size || v.size === item.size) && 
            (!item.color || v.color === item.color)
          );
          
          if (variant) {
            variantId = variant.variantId;
          }
        }
      }
      
      // Use shopifyProductId if available, otherwise use the regular id
      // This allows the checkout to work even if Shopify integration is not set up
      const productId = merchandise.shopifyProductId || merchandise.id;
      
      lineItems.push({
        variant_id: variantId || productId,
        quantity: item.quantity || 1
      });
    }
    
    // Create checkout in Shopify
    const checkout = await shopifyService.createCheckout(lineItems);
    
    res.json({
      checkoutUrl: checkout.web_url,
      checkoutId: checkout.id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
