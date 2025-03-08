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
  sold: {
    type: Number,
    default: 0,
  },
  // Shopify integration fields
  shopifyProductId: {
    type: String,
  },
  shopifyProductUrl: {
    type: String,
  },
  shopifyVariants: [
    {
      variantId: String,
      inventory: Number,
      price: Number,
      size: String,
      color: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Merchandise", MerchandiseSchema);
