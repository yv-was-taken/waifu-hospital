const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import controllers
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for Stripe
// @access  Private
router.post(
  "/create-payment-intent",
  [
    authMiddleware,
    [
      check("items", "Items are required").isArray(),
      check("totalAmount", "Total amount is required").isFloat({ min: 0 }),
    ],
  ],
  paymentController.createPaymentIntent,
);

// @route   POST /api/payments/crypto
// @desc    Process crypto payment
// @access  Private
router.post(
  "/crypto",
  [
    authMiddleware,
    [
      check("items", "Items are required").isArray(),
      check("totalAmount", "Total amount is required").isFloat({ min: 0 }),
      check("cryptoType", "Crypto type is required").not().isEmpty(),
      check("walletAddress", "Wallet address is required").not().isEmpty(),
    ],
  ],
  paymentController.processCryptoPayment,
);

// @route   POST /api/payments/webhook
// @desc    Webhook for payment provider callbacks
// @access  Public
router.post("/webhook", paymentController.webhook);

// @route   POST /api/payments/complete
// @desc    Complete payment and create order
// @access  Private
router.post(
  "/complete",
  [
    authMiddleware,
    [
      check("paymentId", "Payment ID is required").not().isEmpty(),
      check("items", "Items are required").isArray(),
      check("shippingAddress", "Shipping address is required").isObject(),
      check("paymentMethod", "Payment method is required").not().isEmpty(),
    ],
  ],
  paymentController.completePayment,
);

// @route   GET /api/payments/orders
// @desc    Get user's orders
// @access  Private
router.get("/orders", authMiddleware, paymentController.getUserOrders);

// @route   GET /api/payments/orders/:id
// @desc    Get order by ID
// @access  Private
router.get("/orders/:id", authMiddleware, paymentController.getOrderById);

module.exports = router;
