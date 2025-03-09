const Merchandise = require("../models/Merchandise");
const Character = require("../models/Character");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Import printfulService with try/catch to avoid breaking the application if the service is not available
let printfulService;
try {
  printfulService = require("../services/printfulService");
} catch (error) {
  console.warn("Printful service could not be loaded. Merchandise features will be limited.");
  // Create mock printful service to prevent errors
  printfulService = {
    createProduct: async () => ({
      id: `mock_${Date.now()}`,
      external_id: `product_${Date.now()}`
    }),
    getProducts: async () => [],
    getProductVariants: async () => [],
    getProductionCosts: async () => ({ productionCost: 10 }),
    createOrder: async () => ({
      id: `mock_order_${Date.now()}`
    }),
    calculateShipping: async () => [{
      id: 'STANDARD',
      name: 'Standard shipping',
      rate: 7.95
    }]
  };
}

// Import stripeConnectService with try/catch
let stripeConnectService;
try {
  stripeConnectService = require("../services/stripeConnectService");
} catch (error) {
  console.warn("Stripe Connect service could not be loaded. Payment features will be limited.");
  // Create mock stripe connect service to prevent errors
  stripeConnectService = {
    createConnectedAccount: async () => ({
      id: `acct_mock${Date.now()}`
    }),
    createAccountLink: async () => ({
      url: 'https://connect.stripe.com/setup/mock'
    }),
    createPaymentIntentWithFee: async () => ({
      id: `pi_mock${Date.now()}`,
      client_secret: `pi_mock${Date.now()}_secret_mock`
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
    creatorRevenuePercent = 80,
    platformFeePercent = 20
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

    // Get user for Stripe Connect account
    const user = await User.findById(req.user.id);
    
    // If user doesn't have a Stripe Connect account, create one
    let stripeConnectAccountId = user.stripeConnect?.accountId;
    if (!stripeConnectAccountId) {
      try {
        const connectedAccount = await stripeConnectService.createConnectedAccount({
          id: user._id,
          email: user.email,
          username: user.username,
          country: "US" // Default country
        });
        
        stripeConnectAccountId = connectedAccount.id;
        
        // Update user with Stripe Connect account ID
        user.stripeConnect = {
          accountId: stripeConnectAccountId,
          isOnboarded: false,
          payoutsEnabled: false,
          country: "US",
          defaultCurrency: "usd"
        };
        
        await user.save();
      } catch (stripeError) {
        console.error('Stripe Connect account creation failed:', stripeError);
        // Continue with local save even if Stripe fails
      }
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
      productionCost: productionCost || 0,
      creatorRevenue: creatorRevenue || 0,
      creatorRevenuePercent,
      platformFeePercent,
      stripeConnectAccountId
    });

    // Create external ID for Printful
    const externalId = `product_${Date.now()}_${req.user.id}`;
    newMerchandise.printfulExternalId = externalId;

    // Create the merchandise in Printful (with error handling)
    try {
      // If production cost wasn't provided, estimate it
      if (!productionCost) {
        const productionCostData = await printfulService.getProductionCosts(
          getVariantIdForCategory(category)
        );
        newMerchandise.productionCost = productionCostData.productionCost;
      }

      const printfulProduct = await printfulService.createProduct({
        name,
        description,
        price,
        imageUrl,
        category,
        availableSizes: availableSizes || ["N/A"],
        availableColors: availableColors || [],
        stock: stock || 100,
        externalId
      });
      
      // Store Printful product ID and other relevant data
      if (printfulProduct && printfulProduct.id) {
        newMerchandise.printfulProductId = printfulProduct.id;
        
        // Store variants
        if (printfulProduct.variants && printfulProduct.variants.length > 0) {
          const printfulVariants = printfulProduct.variants.map(variant => ({
            variantId: variant.id,
            externalId: variant.external_id,
            retailPrice: variant.retail_price,
            size: getSizeFromVariant(variant),
            color: getColorFromVariant(variant)
          }));
          
          newMerchandise.printfulVariants = printfulVariants;
        }
      }
    } catch (printfulError) {
      console.error('Printful product creation failed:', printfulError);
      // Continue with local save even if Printful fails
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

// Helper function to get variant ID for a category
const getVariantIdForCategory = (category) => {
  const categoryToVariantId = {
    't-shirt': 101,
    'mug': 201,
    'poster': 301,
    'sticker': 401,
    'hoodie': 501,
    'hat': 601,
    'phonecase': 701,
    'other': 999
  };
  
  return categoryToVariantId[category] || 999;
};

// Helper function to extract size from Printful variant
const getSizeFromVariant = (variant) => {
  if (!variant.options) return 'N/A';
  
  const sizeOption = variant.options.find(option => 
    option.id === 'size' || option.id === 'model'
  );
  
  return sizeOption && sizeOption.value ? sizeOption.value[0] : 'N/A';
};

// Helper function to extract color from Printful variant
const getColorFromVariant = (variant) => {
  if (!variant.options) return '';
  
  const colorOption = variant.options.find(option => 
    option.id === 'color'
  );
  
  return colorOption && colorOption.value ? colorOption.value[0] : '';
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
      creatorRevenuePercent,
      platformFeePercent,
      isApproved
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
    if (creatorRevenuePercent) merchandiseFields.creatorRevenuePercent = creatorRevenuePercent;
    if (platformFeePercent) merchandiseFields.platformFeePercent = platformFeePercent;
    if (isApproved !== undefined) merchandiseFields.isApproved = isApproved;

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

// @desc    Create a checkout for merchandise items
// @route   POST /api/merchandise/checkout
// @access  Private
exports.createCheckout = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "Items are required" });
    }
    
    if (!shippingAddress) {
      return res.status(400).json({ msg: "Shipping address is required" });
    }
    
    // Format items for order creation and payment
    const orderItems = [];
    let subtotal = 0;
    const creatorAmounts = {}; // Track amount per creator for Stripe Connect payments
    
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
        // Find variant based on size and color
        if (merchandise.printfulVariants && merchandise.printfulVariants.length > 0) {
          const variant = merchandise.printfulVariants.find(v => 
            (!item.size || v.size === item.size) && 
            (!item.color || v.color === item.color)
          );
          
          if (variant) {
            variantId = variant.variantId;
          }
        }
      }
      
      // If no specific variant found, use first one or default
      if (!variantId && merchandise.printfulVariants && merchandise.printfulVariants.length > 0) {
        variantId = merchandise.printfulVariants[0].variantId;
      }
      
      // Calculate price and revenue distribution
      const itemPrice = merchandise.price * (item.quantity || 1);
      const productionCost = merchandise.productionCost * (item.quantity || 1);
      const platformFee = (itemPrice - productionCost) * (merchandise.platformFeePercent / 100);
      const creatorRevenue = itemPrice - productionCost - platformFee;
      
      // Add to creator amounts for Stripe Connect
      if (merchandise.creator) {
        const creatorId = merchandise.creator.toString();
        if (!creatorAmounts[creatorId]) {
          creatorAmounts[creatorId] = {
            amount: 0,
            stripeAccount: merchandise.stripeConnectAccountId
          };
        }
        creatorAmounts[creatorId].amount += creatorRevenue;
      }
      
      // Add to subtotal
      subtotal += itemPrice;
      
      // Add item to order
      orderItems.push({
        merchandise: merchandise._id,
        quantity: item.quantity || 1,
        size: item.size || 'N/A',
        color: item.color || '',
        price: merchandise.price,
        printfulVariantId: variantId,
        creator: merchandise.creator,
        creatorRevenue: creatorRevenue,
        platformFee: platformFee,
        productionCost: productionCost
      });
    }
    
    // Calculate shipping costs using Printful API
    const shippingRates = await printfulService.calculateShipping({
      shippingAddress,
      items: orderItems.map(item => ({
        printfulVariantId: item.printfulVariantId,
        quantity: item.quantity
      }))
    });
    
    // Choose standard shipping as default
    const shippingCost = shippingRates && shippingRates.length > 0 
      ? shippingRates[0].rate 
      : 7.95; // Default fallback

    // Calculate total amount
    const totalAmount = subtotal + shippingCost;
    
    // Create payment intent with Stripe
    // For this implementation, we'll use the platform account to handle the payment
    // and then distribute to creators via transfers
    const paymentIntent = await stripeConnectService.createPaymentIntentWithFee({
      amount: Math.round(totalAmount * 100), // Stripe requires amounts in cents
      currency: 'usd',
      description: `Order with ${orderItems.length} items`,
      metadata: {
        userId: req.user.id,
      }
    });
    
    // Return checkout information
    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      subtotal,
      shippingCost,
      items: orderItems.map(item => ({
        merchandiseId: item.merchandise,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        creatorRevenue: item.creatorRevenue,
        platformFee: item.platformFee,
        productionCost: item.productionCost
      })),
      shippingRates,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get Stripe Connect onboarding link for creator
// @route   GET /api/merchandise/stripe-connect-onboarding
// @access  Private
exports.getStripeConnectOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // If user doesn't have a Stripe Connect account, create one
    let stripeConnectAccountId = user.stripeConnect?.accountId;
    if (!stripeConnectAccountId) {
      try {
        const connectedAccount = await stripeConnectService.createConnectedAccount({
          id: user._id,
          email: user.email,
          username: user.username,
          country: "US" // Default country
        });
        
        stripeConnectAccountId = connectedAccount.id;
        
        // Update user with Stripe Connect account ID
        user.stripeConnect = {
          accountId: stripeConnectAccountId,
          isOnboarded: false,
          payoutsEnabled: false,
          country: "US",
          defaultCurrency: "usd"
        };
        
        await user.save();
      } catch (stripeError) {
        console.error('Stripe Connect account creation failed:', stripeError);
        return res.status(500).json({ msg: "Failed to create Stripe Connect account" });
      }
    }
    
    // Create onboarding link
    const accountLink = await stripeConnectService.createAccountLink(
      stripeConnectAccountId,
      `${req.protocol}://${req.get('host')}/api/merchandise/stripe-connect-refresh`,
      `${req.protocol}://${req.get('host')}/api/merchandise/stripe-connect-return`
    );
    
    res.json({
      url: accountLink.url
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Handle Stripe Connect onboarding refresh (session expired)
// @route   GET /api/merchandise/stripe-connect-refresh
// @access  Public
exports.handleStripeConnectRefresh = async (req, res) => {
  res.redirect('/dashboard/settings'); // Redirect to settings page
};

// @desc    Handle Stripe Connect onboarding return
// @route   GET /api/merchandise/stripe-connect-return
// @access  Public
exports.handleStripeConnectReturn = async (req, res) => {
  // This is just a redirect point; the frontend should check the account status
  res.redirect('/dashboard/settings'); // Redirect to settings page
};

// @desc    Check Stripe Connect account status
// @route   GET /api/merchandise/stripe-connect-status
// @access  Private
exports.checkStripeConnectStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const stripeConnectAccountId = user.stripeConnect?.accountId;
    
    if (!stripeConnectAccountId) {
      return res.json({
        isConnected: false,
        isOnboarded: false,
        payoutsEnabled: false
      });
    }
    
    // Check account status
    const accountDetails = await stripeConnectService.getAccountDetails(stripeConnectAccountId);
    
    // Update user's Stripe Connect status
    user.stripeConnect.isOnboarded = accountDetails.details_submitted;
    user.stripeConnect.payoutsEnabled = accountDetails.payouts_enabled;
    
    if (accountDetails.details_submitted && !user.stripeConnect.onboardingCompleted) {
      user.stripeConnect.onboardingCompleted = new Date();
    }
    
    await user.save();
    
    res.json({
      isConnected: true,
      isOnboarded: accountDetails.details_submitted,
      payoutsEnabled: accountDetails.payouts_enabled,
      chargesEnabled: accountDetails.charges_enabled,
      dashboardUrl: accountDetails.dashboard_url
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
