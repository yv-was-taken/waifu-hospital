const Purchase = require("../models/Purchase");
const Merchandise = require("../models/Merchandise");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "dummy_stripe_key",
);
const crypto = require("crypto");

// Import stripeConnectService and printfulService with try/catch
let stripeConnectService;
try {
  stripeConnectService = require("../services/stripeConnectService");
} catch (error) {
  console.warn(
    "Stripe Connect service could not be loaded. Payment features will be limited.",
  );
  // Create mock stripe connect service to prevent errors
  stripeConnectService = {
    createConnectedAccount: async () => ({
      id: `acct_mock${Date.now()}`,
    }),
    createPaymentIntentWithFee: async () => ({
      id: `pi_mock${Date.now()}`,
      client_secret: `pi_mock${Date.now()}_secret_mock`,
    }),
  };
}

let printfulService;
try {
  printfulService = require("../services/printfulService");
} catch (error) {
  console.warn(
    "Printful service could not be loaded. Merchandise features will be limited.",
  );
  // Create mock printful service to prevent errors
  printfulService = {
    createOrder: async () => ({
      id: `mock_order_${Date.now()}`,
    }),
    calculateShipping: async () => [
      {
        id: "STANDARD",
        name: "Standard shipping",
        rate: 7.95,
      },
    ],
  };
}

// @desc    Create payment intent for Stripe
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, shippingAddress, shippingMethod } = req.body;

  try {
    // Validate items and calculate total
    const orderItems = [];
    let subtotal = 0;
    const creatorAmounts = {}; // Track amount per creator for Stripe Connect

    // Process each merchandise item
    for (const item of items) {
      const merchandise = await Merchandise.findById(item.merchandiseId);
      if (!merchandise) {
        return res.status(404).json({
          msg: `Merchandise not found: ${item.merchandiseId}`,
        });
      }

      // Find the variant if size/color specified
      let variantId = null;

      if (item.size || item.color) {
        // Find variant based on size and color
        if (
          merchandise.printfulVariants &&
          merchandise.printfulVariants.length > 0
        ) {
          const variant = merchandise.printfulVariants.find(
            (v) =>
              (!item.size || v.size === item.size) &&
              (!item.color || v.color === item.color),
          );

          if (variant) {
            variantId = variant.variantId;
          }
        }
      }

      // If no specific variant found, use first one or default
      if (
        !variantId &&
        merchandise.printfulVariants &&
        merchandise.printfulVariants.length > 0
      ) {
        variantId = merchandise.printfulVariants[0].variantId;
      }

      // Calculate price and revenue distribution
      const itemPrice = merchandise.price * (item.quantity || 1);
      const productionCost = merchandise.productionCost * (item.quantity || 1);
      const platformFee =
        (itemPrice - productionCost) * (merchandise.platformFeePercent / 100);
      const creatorRevenue = itemPrice - productionCost - platformFee;

      // Add to creator amounts for Stripe Connect
      if (merchandise.creator && merchandise.stripeConnectAccountId) {
        const creatorId = merchandise.creator.toString();
        if (!creatorAmounts[creatorId]) {
          creatorAmounts[creatorId] = {
            amount: 0,
            stripeAccount: merchandise.stripeConnectAccountId,
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
        size: item.size || "N/A",
        color: item.color || "",
        price: merchandise.price,
        printfulVariantId: variantId,
        creator: merchandise.creator,
        creatorRevenue: creatorRevenue,
        platformFee: platformFee,
        productionCost: productionCost,
      });
    }

    // Calculate shipping costs using Printful API
    const shippingRates = await printfulService.calculateShipping({
      shippingAddress,
      items: orderItems.map((item) => ({
        printfulVariantId: item.printfulVariantId,
        quantity: item.quantity,
      })),
    });

    // Choose shipping method or default to standard
    let shippingCost = 0;
    if (shippingMethod && shippingRates) {
      const selectedMethod = shippingRates.find(
        (rate) => rate.id === shippingMethod,
      );
      shippingCost = selectedMethod
        ? selectedMethod.rate
        : shippingRates[0]?.rate || 7.95;
    } else {
      shippingCost =
        shippingRates && shippingRates.length > 0
          ? shippingRates[0].rate
          : 7.95;
    }

    // Calculate total amount with shipping
    const totalAmount = subtotal + shippingCost;

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripeConnectService.createPaymentIntentWithFee(
      {
        amount: Math.round(totalAmount * 100), // Stripe requires amounts in cents
        currency: "usd",
        description: `Order with ${orderItems.length} items`,
        metadata: {
          userId: req.user.id,
          itemsCount: orderItems.length,
          shippingCost: shippingCost,
        },
      },
    );

    // Return checkout information
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount,
      subtotal,
      shippingCost,
      items: orderItems.map((item) => ({
        merchandiseId: item.merchandise,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        creatorRevenue: item.creatorRevenue,
        platformFee: item.platformFee,
        productionCost: item.productionCost,
      })),
      shippingRates,
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

// @desc    Webhook for Stripe payment callbacks
// @route   POST /api/payments/webhook/stripe
// @access  Public
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret =
    process.env.STRIPE_WEBHOOK_SECRET || "dummy_webhook_secret";

  let event;

  try {
    // Verify the event came from Stripe
    if (process.env.STRIPE_WEBHOOK_SECRET !== "dummy_webhook_secret") {
      event = stripeConnectService.constructWebhookEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
    } else {
      // For development without proper signatures
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object);
        break;
      case "transfer.created":
        await handleTransferCreated(event.data.object);
        break;
      case "transfer.paid":
        await handleTransferPaid(event.data.object);
        break;
      case "account.updated":
        await handleConnectedAccountUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Stripe Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// @desc    Webhook for Printful fulfillment callbacks
// @route   POST /api/payments/webhook/printful
// @access  Public
exports.printfulWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (!event || !event.type) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Handle the event
    switch (event.type) {
      case "package_shipped":
        await handlePrintfulOrderShipped(event.data);
        break;
      case "order_created":
        await handlePrintfulOrderCreated(event.data);
        break;
      case "order_updated":
        await handlePrintfulOrderUpdated(event.data);
        break;
      case "order_failed":
        await handlePrintfulOrderFailed(event.data);
        break;
      default:
        console.log(`Unhandled Printful event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Printful Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Stripe webhook event handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(
    `PaymentIntent ${paymentIntent.id} succeeded: ${paymentIntent.amount}`,
  );

  try {
    // Look up the order by payment intent ID
    const purchase = await Purchase.findOne({
      stripePaymentIntent: paymentIntent.id,
      isPaid: false,
    });

    if (!purchase) {
      console.log(`No purchase found for payment intent ${paymentIntent.id}`);
      return;
    }

    // Update purchase status
    purchase.isPaid = true;
    purchase.paidAt = new Date();

    // If no Printful order yet, create one
    if (!purchase.printfulOrderId) {
      try {
        // Fetch user for email
        const user = await User.findById(purchase.user);

        const printfulOrder = await printfulService.createOrder({
          shippingAddress: purchase.shippingAddress,
          email: user?.email || purchase.shippingAddress.email,
          phone: purchase.shippingAddress.phone,
          items: purchase.items.map((item) => ({
            printfulVariantId: item.printfulVariantId,
            quantity: item.quantity,
            price: item.price,
          })),
        });

        if (printfulOrder && printfulOrder.id) {
          purchase.printfulOrderId = printfulOrder.id;
          purchase.printfulOrderStatus = printfulOrder.status || "pending";
        }
      } catch (printfulError) {
        console.error("Error creating Printful order:", printfulError);
      }
    }

    await purchase.save();
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
}

async function handleChargeSucceeded(charge) {
  console.log(`Charge ${charge.id} succeeded: ${charge.amount}`);

  try {
    // This could trigger creator payouts
    if (charge.transfer_data && charge.transfer_data.destination) {
      console.log(
        `Transfer to ${charge.transfer_data.destination} being processed`,
      );
    }
  } catch (error) {
    console.error("Error handling charge succeeded:", error);
  }
}

async function handleTransferCreated(transfer) {
  console.log(
    `Transfer ${transfer.id} created: ${transfer.amount} to ${transfer.destination}`,
  );

  try {
    // Look for creator account that matches this destination
    const creator = await User.findOne({
      "stripeConnect.accountId": transfer.destination,
    });

    if (!creator) {
      console.log(
        `No creator found for transfer destination ${transfer.destination}`,
      );
      return;
    }

    // Update creator balance based on transfer metadata
    // In a real implementation, you'd track which purchase this is for
    if (transfer.metadata && transfer.metadata.purchaseId) {
      const purchase = await Purchase.findById(transfer.metadata.purchaseId);

      if (purchase) {
        // Find the matching payout record
        const payoutIndex = purchase.creatorPayouts.findIndex(
          (p) => p.creator.toString() === creator._id.toString(),
        );

        if (payoutIndex !== -1) {
          purchase.creatorPayouts[payoutIndex].stripeTransferId = transfer.id;
          purchase.creatorPayouts[payoutIndex].status = "pending";
          await purchase.save();
        }
      }
    }
  } catch (error) {
    console.error("Error handling transfer created:", error);
  }
}

async function handleTransferPaid(transfer) {
  console.log(
    `Transfer ${transfer.id} paid: ${transfer.amount} to ${transfer.destination}`,
  );

  try {
    // Update creator balance and mark payouts as completed
    const creator = await User.findOne({
      "stripeConnect.accountId": transfer.destination,
    });

    if (!creator) {
      console.log(
        `No creator found for transfer destination ${transfer.destination}`,
      );
      return;
    }

    // Move the pending balance to available
    if (transfer.amount > 0) {
      const amountInDollars = transfer.amount / 100; // Convert from cents

      await User.findByIdAndUpdate(creator._id, {
        $inc: {
          "balance.available": amountInDollars,
          "balance.pending": -amountInDollars,
        },
        $set: {
          "balance.lastUpdated": new Date(),
        },
      });

      // Update any pending payouts to paid status
      if (transfer.metadata && transfer.metadata.purchaseId) {
        const purchase = await Purchase.findById(transfer.metadata.purchaseId);

        if (purchase) {
          // Find the matching payout record
          const payoutIndex = purchase.creatorPayouts.findIndex(
            (p) => p.creator.toString() === creator._id.toString(),
          );

          if (payoutIndex !== -1) {
            purchase.creatorPayouts[payoutIndex].status = "paid";
            purchase.creatorPayouts[payoutIndex].paidAt = new Date();
            await purchase.save();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling transfer paid:", error);
  }
}

async function handleConnectedAccountUpdated(account) {
  console.log(`Connected account ${account.id} updated`);

  try {
    // Update the user's Stripe Connect status based on account changes
    const user = await User.findOne({ "stripeConnect.accountId": account.id });

    if (!user) {
      console.log(`No user found for Stripe Connect account ${account.id}`);
      return;
    }

    // Update user's Stripe Connect status
    user.stripeConnect.isOnboarded = account.details_submitted;
    user.stripeConnect.payoutsEnabled = account.payouts_enabled;

    if (account.details_submitted && !user.stripeConnect.onboardingCompleted) {
      user.stripeConnect.onboardingCompleted = new Date();
    }

    await user.save();
  } catch (error) {
    console.error("Error handling connected account updated:", error);
  }
}

// Printful webhook event handlers
async function handlePrintfulOrderShipped(data) {
  console.log(`Printful order ${data.id} shipped`);

  try {
    // Find the purchase with this Printful order ID
    const purchase = await Purchase.findOne({ printfulOrderId: data.id });

    if (!purchase) {
      console.log(`No purchase found for Printful order ${data.id}`);
      return;
    }

    // Update tracking information
    purchase.trackingNumber = data.tracking_number;
    purchase.trackingUrl = data.tracking_url;
    purchase.printfulOrderStatus = "shipped";
    purchase.isShipped = true;
    purchase.shippedAt = new Date();
    purchase.status = "shipped";

    await purchase.save();
  } catch (error) {
    console.error("Error handling Printful order shipped:", error);
  }
}

async function handlePrintfulOrderCreated(data) {
  console.log(`Printful order ${data.id} created`);

  try {
    // Find any purchases that need to be linked to this Printful order
    // This is a fallback in case the order wasn't linked during checkout
    const unlinkedPurchases = await Purchase.find({
      printfulOrderId: { $exists: false },
      isPaid: true,
      status: "processing",
    })
      .sort({ createdAt: -1 })
      .limit(5);

    for (const purchase of unlinkedPurchases) {
      // Check if this might be the right order by matching items
      if (purchase.items.length === data.items.length) {
        purchase.printfulOrderId = data.id;
        purchase.printfulOrderStatus = data.status;
        await purchase.save();
        console.log(
          `Linked Printful order ${data.id} to purchase ${purchase._id}`,
        );
        break;
      }
    }
  } catch (error) {
    console.error("Error handling Printful order created:", error);
  }
}

async function handlePrintfulOrderUpdated(data) {
  console.log(`Printful order ${data.id} updated to status: ${data.status}`);

  try {
    const purchase = await Purchase.findOne({ printfulOrderId: data.id });

    if (!purchase) {
      console.log(`No purchase found for Printful order ${data.id}`);
      return;
    }

    purchase.printfulOrderStatus = data.status;

    // Update status based on Printful order status
    if (data.status === "fulfilled") {
      purchase.isShipped = true;
      purchase.shippedAt = new Date();
      purchase.status = "shipped";
    } else if (data.status === "canceled") {
      purchase.status = "cancelled";
    }

    await purchase.save();
  } catch (error) {
    console.error("Error handling Printful order updated:", error);
  }
}

async function handlePrintfulOrderFailed(data) {
  console.log(
    `Printful order ${data.id} failed: ${data.reason || "Unknown reason"}`,
  );

  try {
    const purchase = await Purchase.findOne({ printfulOrderId: data.id });

    if (!purchase) {
      console.log(`No purchase found for Printful order ${data.id}`);
      return;
    }

    purchase.printfulOrderStatus = "failed";
    purchase.status = "processing"; // Keep as processing so it can be fixed manually

    await purchase.save();
  } catch (error) {
    console.error("Error handling Printful order failed:", error);
  }
}

// @desc    Complete payment and create order
// @route   POST /api/payments/complete
// @access  Private
exports.completePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    paymentIntentId,
    items,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    subtotal,
    shippingCost,
    totalAmount,
  } = req.body;

  try {
    // Validate payment intent and items
    if (!paymentIntentId && paymentMethod === "credit_card") {
      return res.status(400).json({
        msg: "Payment intent ID is required for credit card payments",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "Items are required" });
    }

    // Prepare order items with details
    const orderItems = [];
    const creatorPayouts = [];

    for (const item of items) {
      const merchandise = await Merchandise.findById(item.merchandiseId);
      if (!merchandise) {
        return res.status(404).json({
          msg: `Merchandise not found: ${item.merchandiseId}`,
        });
      }

      // Check if item is in stock (for inventory-managed items)
      if (merchandise.stock < item.quantity) {
        return res.status(400).json({
          msg: `Item ${merchandise.name} is out of stock. Only ${merchandise.stock} units available.`,
        });
      }

      // Find the specific variant
      let variantId = item.printfulVariantId;
      if (!variantId && (item.size || item.color)) {
        // Find variant based on size and color
        if (
          merchandise.printfulVariants &&
          merchandise.printfulVariants.length > 0
        ) {
          const variant = merchandise.printfulVariants.find(
            (v) =>
              (!item.size || v.size === item.size) &&
              (!item.color || v.color === item.color),
          );

          if (variant) {
            variantId = variant.variantId;
          }
        }
      }

      // If no specific variant found, use first one or default
      if (
        !variantId &&
        merchandise.printfulVariants &&
        merchandise.printfulVariants.length > 0
      ) {
        variantId = merchandise.printfulVariants[0].variantId;
      }

      // Calculate revenue distribution
      const itemPrice = merchandise.price * item.quantity;
      const productionCost = merchandise.productionCost * item.quantity;
      const platformFee =
        (itemPrice - productionCost) * (merchandise.platformFeePercent / 100);
      const creatorRevenue = itemPrice - productionCost - platformFee;

      // Add to order items
      orderItems.push({
        merchandise: merchandise._id,
        quantity: item.quantity,
        size: item.size || "N/A",
        color: item.color || "",
        price: merchandise.price,
        printfulVariantId: variantId,
        creator: merchandise.creator,
        creatorRevenue,
        platformFee,
        productionCost,
      });

      // Track creator payout information
      if (merchandise.creator) {
        const existingPayout = creatorPayouts.find(
          (p) => p.creator.toString() === merchandise.creator.toString(),
        );

        if (existingPayout) {
          existingPayout.amount += creatorRevenue;
        } else {
          creatorPayouts.push({
            creator: merchandise.creator,
            amount: creatorRevenue,
            status: "pending",
          });
        }
      }

      // Update merchandise stats
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
      items: orderItems,
      totalAmount: totalAmount || subtotal + shippingCost,
      subtotal: subtotal || totalAmount - shippingCost,
      shippingCost: shippingCost || 0,
      shippingAddress,
      paymentMethod,
      stripePaymentIntent: paymentIntentId,
      printfulShippingMethod: shippingMethod || "STANDARD",
      isPaid: true,
      paidAt: Date.now(),
      status: "processing",
      creatorPayouts,
    });

    // Create order with Printful after payment is confirmed
    try {
      const printfulOrder = await printfulService.createOrder({
        shippingAddress,
        email: req.user.email,
        phone: shippingAddress.phone,
        items: orderItems.map((item) => ({
          printfulVariantId: item.printfulVariantId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      if (printfulOrder && printfulOrder.id) {
        purchase.printfulOrderId = printfulOrder.id;
        purchase.printfulOrderStatus = printfulOrder.status || "pending";
      }
    } catch (printfulError) {
      console.error("Error creating Printful order:", printfulError);
      // Continue without Printful order - will need to be created manually
    }

    await purchase.save();

    // Update creator balances
    for (const payout of creatorPayouts) {
      await User.findByIdAndUpdate(payout.creator, {
        $inc: {
          "balance.pending": payout.amount,
          "balance.totalEarned": payout.amount,
        },
        $set: {
          "balance.lastUpdated": new Date(),
        },
      });
    }

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

// @desc    Get creator sales and revenue
// @route   GET /api/payments/creator/sales
// @access  Private
exports.getCreatorSales = async (req, res) => {
  try {
    // Get all purchases that include merchandise created by this user
    const sales = await Purchase.find({
      "items.creator": req.user.id,
      isPaid: true,
    })
      .populate({
        path: "items.merchandise",
        select: "name imageUrl price category",
        populate: {
          path: "character",
          select: "name imageUrl",
        },
      })
      .sort({ createdAt: -1 });

    // Calculate total revenue, pending revenue, and paid revenue
    let totalRevenue = 0;
    let pendingRevenue = 0;
    let paidRevenue = 0;

    // Filter items in each purchase that belong to this creator
    const salesData = sales.map((purchase) => {
      // Filter only items that belong to this creator
      const creatorItems = purchase.items.filter(
        (item) => item.creator && item.creator.toString() === req.user.id,
      );

      // Calculate revenue for these items
      const revenue = creatorItems.reduce(
        (sum, item) => sum + item.creatorRevenue,
        0,
      );

      // Add to totals
      totalRevenue += revenue;

      // Check if revenue has been paid to creator
      const creatorPayout = purchase.creatorPayouts.find(
        (payout) => payout.creator.toString() === req.user.id,
      );

      if (creatorPayout) {
        if (creatorPayout.status === "paid") {
          paidRevenue += revenue;
        } else {
          pendingRevenue += revenue;
        }
      } else {
        pendingRevenue += revenue;
      }

      return {
        purchaseId: purchase._id,
        purchaseDate: purchase.createdAt,
        status: purchase.status,
        items: creatorItems.map((item) => ({
          merchandise: item.merchandise,
          quantity: item.quantity,
          revenue: item.creatorRevenue,
          paymentStatus: creatorPayout ? creatorPayout.status : "pending",
        })),
        revenue,
        paymentStatus: creatorPayout ? creatorPayout.status : "pending",
      };
    });

    // Get user balance
    const user = await User.findById(req.user.id);

    res.json({
      sales: salesData,
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        paid: paidRevenue,
      },
      balance: user.balance || {
        available: 0,
        pending: 0,
        totalEarned: 0,
      },
      stripeConnect: user.stripeConnect || {
        isOnboarded: false,
        payoutsEnabled: false,
      },
    });
  } catch (err) {
    console.error("Error getting creator sales:", err);
    res.status(500).json({ msg: "Failed to get creator sales" });
  }
};
