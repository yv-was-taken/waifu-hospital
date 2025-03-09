const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      merchandise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchandise",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      size: {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL", "N/A"],
        default: "N/A",
      },
      color: {
        type: String,
        default: "",
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      printfulVariantId: {
        type: String,
      },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      creatorRevenue: {
        type: Number,
        min: 0,
      },
      platformFee: {
        type: Number,
        min: 0,
      },
      productionCost: {
        type: Number,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "crypto", "paypal"],
    required: true,
  },
  // Stripe payment fields
  stripePaymentIntent: {
    type: String,
  },
  stripeClientSecret: {
    type: String,
  },
  // Printful order fields
  printfulOrderId: {
    type: String,
  },
  printfulOrderStatus: {
    type: String,
  },
  printfulShippingMethod: {
    type: String,
  },
  trackingNumber: {
    type: String,
  },
  trackingUrl: {
    type: String,
  },
  // Payment and fulfillment status
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isShipped: {
    type: Boolean,
    default: false,
  },
  shippedAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  // Revenue tracking
  creatorPayouts: [
    {
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      amount: {
        type: Number,
        min: 0,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      stripeTransferId: {
        type: String,
      },
      paidAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Purchase", PurchaseSchema);
