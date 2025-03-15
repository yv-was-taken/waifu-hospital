const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import controllers
const merchandiseController = require("../controllers/merchandiseController");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST /api/merchandise
// @desc    Create a new merchandise item
// @access  Private
router.post(
  "/",
  [
    authMiddleware,
    [
      check("name", "Name is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
      check("price", "Price is required and must be a positive number").isFloat(
        { min: 0 },
      ),
      check("imageUrl", "Image URL is required").not().isEmpty(),
      check("character", "Character ID is required").not().isEmpty(),
      check("category", "Category is required").not().isEmpty(),
    ],
  ],
  merchandiseController.createMerchandise,
);

// @route   GET /api/merchandise
// @desc    Get all merchandise
// @access  Public
router.get("/", merchandiseController.getMerchandise);

// @route   GET /api/merchandise/creator
// @desc    Get all merchandise for logged in creator
// @access  Private
router.get(
  "/creator",
  authMiddleware,
  merchandiseController.getCreatorMerchandise,
);

// @route   GET /api/merchandise/character/:characterId
// @desc    Get all merchandise for a character
// @access  Public
router.get(
  "/character/:characterId",
  merchandiseController.getCharacterMerchandise,
);

// @route   GET /api/merchandise/:id
// @desc    Get merchandise by ID
// @access  Public
router.get("/:id", merchandiseController.getMerchandiseById);

// @route   PUT /api/merchandise/:id
// @desc    Update a merchandise item
// @access  Private
router.put("/:id", authMiddleware, merchandiseController.updateMerchandise);

// @route   DELETE /api/merchandise/:id
// @desc    Delete a merchandise item
// @access  Private
router.delete("/:id", authMiddleware, merchandiseController.deleteMerchandise);

// @route   POST /api/merchandise/checkout
// @desc    Create a Shopify checkout for merchandise items
// @access  Private
router.post("/checkout", authMiddleware, merchandiseController.createCheckout);

// @route   POST /api/merchandise/generate-mockups
// @desc    Generate product mockups for character image
// @access  Private
router.post(
  "/generate-mockups",
  authMiddleware,
  merchandiseController.generateMockups,
);

module.exports = router;
