const mongoose = require("mongoose");

const MerchandiseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  character: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Character",
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    enum: [
      "t-shirt",
      "mug",
      "poster",
      "sticker",
      "hoodie",
      "hat",
      "phonecase",
      "other",
    ],
    required: true,
  },
  availableSizes: [
    {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "N/A"],
    },
  ],
  availableColors: [
    {
      type: String,
    },
  ],
  stock: {
    type: Number,
    default: 100,
    min: 0,
  },
  productionCost: {
    type: Number,
    min: 0,
  },
  creatorRevenue: {
    type: Number,
    min: 0,
  },
  creatorRevenuePercent: {
    type: Number,
    default: 80,
    min: 0,
    max: 100,
  },
  platformFeePercent: {
    type: Number,
    default: 20,
    min: 0,
    max: 100,
  },
  sold: {
    type: Number,
    default: 0,
  },
  // Printful integration fields
  printfulProductId: {
    type: String,
  },
  printfulExternalId: {
    type: String,
  },
  printfulVariants: [
    {
      variantId: String,
      externalId: String,
      retailPrice: Number,
      size: String,
      color: String
    }
  ],
  // Stripe Connect integration fields
  stripeConnectAccountId: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Merchandise", MerchandiseSchema);
