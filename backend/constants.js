const PRODUCT_IDS_BY_CATEGORY = {
  "t-shirt": 12,
  hoodie: 146,
  hat: 627,
  mug: 300,
  mousepad: 583,
  //@dev may want different mockups for both holographic and vinyl stickers...
  //just going to use holographic for both for now
  //"vinyl-stickers": 358,
  //"holographic-stickers": 673
  stickers: 673,
};

const VARIANT_IDS = {
  //black t shirts
  "Gildan Unisex Softstyle T-Shirt (Black / 3XL)": 629,
  "Gildan Unisex Softstyle T-Shirt (Black / 2XL)": 598,
  "Gildan Unisex Softstyle T-Shirt (Black / XL)": 567,
  "Gildan Unisex Softstyle T-Shirt (Black / L)": 536,
  "Gildan Unisex Softstyle T-Shirt (Black / M)": 505,
  "Gildan Unisex Softstyle T-Shirt (Black / S)": 474,
  //white t shirts
  "Gildan Unisex Softstyle T-Shirt (White / 3XL)": 628,
  "Gildan Unisex Softstyle T-Shirt (White / 2XL)": 597,
  "Gildan Unisex Softstyle T-Shirt (White / XL)": 566,
  "Gildan Unisex Softstyle T-Shirt (White / L)": 535,
  "Gildan Unisex Softstyle T-Shirt (White / M)": 504,
  "Gildan Unisex Softstyle T-Shirt (White / S)": 473,
  //black hoodies
  "Gildan Unisex Hooded Sweatshirt (Black / 3XL)": 5535,
  "Gildan Unisex Hooded Sweatshirt (Black / 2XL)": 5534,
  "Gildan Unisex Hooded Sweatshirt (Black / XL)": 5533,
  "Gildan Unisex Hooded Sweatshirt (Black / L)": 5532,
  "Gildan Unisex Hooded Sweatshirt (Black / M)": 5531,
  "Gildan Unisex Hooded Sweatshirt (Black / S)": 5530,
  //white hoodies
  "Gildan Unisex Hooded Sweatshirt (White / 3XL)": 5527,
  "Gildan Unisex Hooded Sweatshirt (White / 2XL)": 5526,
  "Gildan Unisex Hooded Sweatshirt (White / XL)": 5525,
  "Gildan Unisex Hooded Sweatshirt (White / L)": 5524,
  "Gildan Unisex Hooded Sweatshirt (White / M)": 5523,
  "Gildan Unisex Hooded Sweatshirt (White / S)": 5522,
  //hats
  "Otto Cap Foam Trucker Hat (White / One size)": 15905,
  "Otto Cap Foam Trucker Hat (Black/White/Black / One size)": 15908,
  //coffee mugs
  "Black Glossy Mug (11 oz)": 9323,
  "White Glossy Mug 11 oz": 1320,
  //mouse pads
  "Gaming Mouse Pad (White / 18″×16″)": 14943,
  "Gaming Mouse Pad (White / 36″×18″)": 14942,
  //stickers
  "Kiss Cut Vinyl Stickers (3″×3″in)": 10163,
  "Kiss Cut Vinyl Stickers (4″×4″in)": 10164,
  "Kiss Cut Vinyl Stickers (5.5″×5.5″in)": 10165,
  "Kiss Cut Vinyl Stickers (White / 15″×3.75″)": 16362,
  "Kiss-Cut Holographic Stickers (3″×3″in)": 16705,
  "Kiss-Cut Holographic Stickers (4″×4″in)": 16706,
  "Kiss-Cut Holographic Stickers (5.5″×5.5″in)": 16707,
};

const VARIANT_IDS_BY_PRODUCT_ID = {
  12: [629, 628, 598, 597, 567, 566, 536, 535, 505, 504, 474, 473],
  146: [5535, 5527, 5534, 5526, 5525, 5533, 5524, 5532, 5523, 5531],
  627: [15905, 15908],
  300: [9323, 1320],
  583: [14943, 14942],
  358: [10163, 10164, 10165, 16362],
  673: [16705, 16706, 16707],
};

const PRODUCT_ID_RETAIL_PRICES = {
  //t shirts
  629: "39.99",
  598: "39.99",
  567: "39.99",
  536: "39.99",
  505: "39.99",
  474: "39.99",
  628: "39.99",
  597: "39.99",
  566: "39.99",
  535: "39.99",
  504: "39.99",
  473: "39.99",
  //hoodies
  5535: "69.99",
  5534: "69.99",
  5533: "69.99",
  5532: "69.99",
  5531: "69.99",
  5530: "69.99",
  5527: "69.99",
  5526: "69.99",
  5524: "69.99",
  5523: "69.99",
  5522: "69.99",
  //hats
  15905: "29.99",
  15908: "29.99",
  //mugs
  9323: "19.99",
  1320: "19.99",
  //mouse pad
  14943: "19.99",
  14942: "29.99",
  //@dev may want to change these prices. some market research needed..
  //vinyl stickers
  10163: "0.99",
  10164: "1.49",
  10165: "1.99",
  16362: "4.99",
  //holographic stickers
  16705: "1.99",
  16706: "2.49",
  16707: "4.99",
};

module.exports = {
  VARIANT_IDS,
  PRODUCT_IDS_BY_CATEGORY,
  PRODUCT_ID_RETAIL_PRICES,
  VARIANT_IDS_BY_PRODUCT_ID,
};
