const Purchase = require("../models/Purchase");
const Merchandise = require("../models/Merchandise");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "YOUR_STRIPE_SECRET_KEY",
);
const crypto = require("crypto");

// @desc    Create payment intent for Stripe
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, totalAmount } = req.body;

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe requires amounts in cents
      currency: "usd",
      metadata: {
        userId: req.user.id,
        itemsCount: items.length,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ msg: "Failed to create payment intent" });
  }
};

// @desc    Process crypto payment
// @route   POST /api/payments/crypto
// @access  Private
exports.processCryptoPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, totalAmount, cryptoType, walletAddress } = req.body;

  try {
    // In a real app, this would integrate with a crypto payment processor
    // For demo purposes, we'll simulate a successful payment

    // Generate a unique payment ID
    const paymentId = crypto.randomBytes(16).toString("hex");

    res.json({
      paymentId,
      status: "pending",
      message: `Please send ${totalAmount} ${cryptoType} to the wallet address: ${walletAddress || "DEMO_WALLET_ADDRESS"}`,
    });
  } catch (err) {
    console.error("Error processing crypto payment:", err);
    res.status(500).json({ msg: "Failed to process crypto payment" });
  }
};

// @desc    Webhook for payment provider callbacks
// @route   POST /api/payments/webhook
// @access  Public
exports.webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret =
    process.env.STRIPE_WEBHOOK_SECRET || "YOUR_STRIPE_WEBHOOK_SECRET";

  let event;

  try {
    // Verify the event came from Stripe
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without proper signatures
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Handle successful payment here
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`,
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// @desc    Complete payment and create order
// @route   POST /api/payments/complete
// @access  Private
exports.completePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { paymentId, items, shippingAddress, paymentMethod } = req.body;

  try {
    // Validate items and calculate total
    const itemsWithDetails = [];
    let totalAmount = 0;

    for (const item of items) {
      const merchandise = await Merchandise.findById(item.merchandiseId);
      if (!merchandise) {
        return res
          .status(404)
          .json({ msg: `Merchandise with ID ${item.merchandiseId} not found` });
      }

      // Check if item is in stock
      if (merchandise.stock < item.quantity) {
        return res.status(400).json({
          msg: `Item ${merchandise.name} is out of stock. Only ${merchandise.stock} units available.`,
        });
      }

      // Add item details
      itemsWithDetails.push({
        merchandise: merchandise._id,
        quantity: item.quantity,
        size: item.size || "N/A",
        color: item.color || "",
        price: merchandise.price,
      });

      // Update total
      totalAmount += merchandise.price * item.quantity;

      // Update stock
      await Merchandise.findByIdAndUpdate(merchandise._id, {
        $inc: {
          stock: -item.quantity,
          sold: item.quantity,
        },
      });
    }

    // Create purchase record
    const purchase = new Purchase({
      user: req.user.id,
      items: itemsWithDetails,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentId,
      isPaid: true,
      paidAt: Date.now(),
      status: "processing",
    });

    await purchase.save();

    res.json(purchase);
  } catch (err) {
    console.error("Error completing payment:", err);
    res.status(500).json({ msg: "Failed to complete payment" });
  }
};

// @desc    Get user's orders
// @route   GET /api/payments/orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Purchase.find({ user: req.user.id })
      .populate({
        path: "items.merchandise",
        select: "name imageUrl price category",
        populate: {
          path: "character",
          select: "name imageUrl",
        },
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error getting orders:", err);
    res.status(500).json({ msg: "Failed to get orders" });
  }
};

// @desc    Get order by ID
// @route   GET /api/payments/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Purchase.findById(req.params.id).populate({
      path: "items.merchandise",
      select: "name imageUrl price category",
      populate: {
        path: "character",
        select: "name imageUrl",
      },
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error getting order:", err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.status(500).json({ msg: "Failed to get order" });
  }
};
