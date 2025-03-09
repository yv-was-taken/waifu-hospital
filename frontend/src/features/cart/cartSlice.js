import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../utils/api";
import { setAlert } from "../alerts/alertSlice";

// Create Shopify checkout
export const createShopifyCheckout = createAsyncThunk(
  "cart/createShopifyCheckout",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { cart } = getState();

      // Format items for the checkout API
      const items = cart.cartItems.map((item) => ({
        merchandiseId: item._id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const res = await api.post("/api/merchandise/checkout", { items });

      dispatch(
        setAlert({
          msg: "Checkout created successfully!",
          type: "success",
        }),
      );

      return res.data;
    } catch (err) {
      dispatch(
        setAlert({
          msg: err.response?.data?.msg || "Failed to create checkout",
          type: "error",
        }),
      );

      return rejectWithValue(
        err.response?.data?.msg || "Failed to create checkout",
      );
    }
  },
);

// Create payment intent
export const createPaymentIntent = createAsyncThunk(
  "cart/createPaymentIntent",
  async ({ items, totalAmount }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/payments/create-payment-intent", {
        items,
        totalAmount,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to create payment intent",
      );
    }
  },
);

// Process crypto payment
export const processCryptoPayment = createAsyncThunk(
  "cart/processCryptoPayment",
  async (
    { items, totalAmount, cryptoType, walletAddress },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post("/api/payments/crypto", {
        items,
        totalAmount,
        cryptoType,
        walletAddress,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to process crypto payment",
      );
    }
  },
);

// Complete payment
export const completePayment = createAsyncThunk(
  "cart/completePayment",
  async (
    { paymentId, items, shippingAddress, paymentMethod },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const res = await axios.post("/api/payments/complete", {
        paymentId,
        items,
        shippingAddress,
        paymentMethod,
      });

      dispatch(
        setAlert({
          msg: "Order placed successfully!",
          type: "success",
        }),
      );

      return res.data;
    } catch (err) {
      dispatch(
        setAlert({
          msg: err.response.data.msg || "Failed to complete order",
          type: "error",
        }),
      );

      return rejectWithValue(
        err.response.data.msg || "Payment completion failed",
      );
    }
  },
);

// Get user orders
export const getUserOrders = createAsyncThunk(
  "cart/getUserOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/payments/orders");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || "Failed to fetch orders");
    }
  },
);

// Get order by ID
export const getOrderById = createAsyncThunk(
  "cart/getOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/payments/orders/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || "Failed to fetch order");
    }
  },
);

// Initial state
const initialState = {
  cartItems: localStorage.getItem("cartItems")
    ? JSON.parse(localStorage.getItem("cartItems"))
    : [],
  shippingAddress: localStorage.getItem("shippingAddress")
    ? JSON.parse(localStorage.getItem("shippingAddress"))
    : {},
  paymentMethod: localStorage.getItem("paymentMethod") || "credit_card",
  clientSecret: null,
  paymentId: null,
  orders: [],
  currentOrder: null,
  shopifyCheckoutUrl: null,
  shopifyCheckoutId: null,
  loading: false,
  error: null,
};

// Helper function to update localStorage
const updateLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Slice
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;

      const existItem = state.cartItems.find(
        (x) =>
          x._id === item._id && x.size === item.size && x.color === item.color,
      );

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x._id === existItem._id &&
          x.size === existItem.size &&
          x.color === existItem.color
            ? item
            : x,
        );
      } else {
        state.cartItems = [...state.cartItems, item];
      }

      updateLocalStorage("cartItems", state.cartItems);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (x) =>
          !(
            x._id === action.payload._id &&
            x.size === action.payload.size &&
            x.color === action.payload.color
          ),
      );

      updateLocalStorage("cartItems", state.cartItems);
    },
    updateCartItemQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;

      state.cartItems = state.cartItems.map((item) =>
        item._id === id && item.size === size && item.color === color
          ? { ...item, quantity }
          : item,
      );

      updateLocalStorage("cartItems", state.cartItems);
    },
    clearCart: (state) => {
      state.cartItems = [];
      localStorage.removeItem("cartItems");
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      updateLocalStorage("shippingAddress", action.payload);
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      localStorage.setItem("paymentMethod", action.payload);
    },
    clearPaymentInfo: (state) => {
      state.clientSecret = null;
      state.paymentId = null;
      state.shopifyCheckoutUrl = null;
      state.shopifyCheckoutId = null;
    },
    clearOrderInfo: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Shopify checkout
      .addCase(createShopifyCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShopifyCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.shopifyCheckoutUrl = action.payload.checkoutUrl;
        state.shopifyCheckoutId = action.payload.checkoutId;
      })
      .addCase(createShopifyCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create payment intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading = false;
        state.clientSecret = action.payload.clientSecret;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Process crypto payment
      .addCase(processCryptoPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(processCryptoPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentId = action.payload.paymentId;
      })
      .addCase(processCryptoPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Complete payment
      .addCase(completePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(completePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = [];
        state.currentOrder = action.payload;
        localStorage.removeItem("cartItems");
      })
      .addCase(completePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get user orders
      .addCase(getUserOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get order by ID
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  saveShippingAddress,
  savePaymentMethod,
  clearPaymentInfo,
  clearOrderInfo,
} = cartSlice.actions;

export default cartSlice.reducer;
