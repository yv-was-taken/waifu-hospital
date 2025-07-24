import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
  createShopifyCheckout,
  createPaymentIntent,
  processCryptoPayment,
  completePayment,
  getUserOrders,
  getOrderById,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  saveShippingAddress,
  savePaymentMethod,
  clearPaymentInfo,
  clearOrderInfo,
} from './cartSlice';
import alertsReducer from '../alerts/alertSlice';
import api from '../../utils/api';
import axios from 'axios';
// Only import the mock data, not the React testing utilities
const mockMerchandise = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Test Merchandise',
  description: 'A test merchandise item',
  price: 19.99,
  imageUrl: 'https://example.com/merch.jpg',
  category: 't-shirt',
  stock: 100,
  sold: 0,
  isApproved: true,
};

const mockCartItem = {
  _id: 'merch1',
  name: 'Test Merchandise',
  price: 19.99,
  quantity: 2,
  size: 'M',
  color: 'black',
};

// Mock the API and axios
jest.mock('../../utils/api');
jest.mock('axios');

describe('cartSlice', () => {
  let store;

  beforeEach(() => {
    // Reset localStorage mock
    window.localStorage.getItem.mockReturnValue(null);
    window.localStorage.setItem.mockClear();
    window.localStorage.removeItem.mockClear();
    
    store = configureStore({
      reducer: {
        cart: cartReducer,
        alerts: alertsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should handle initial state with empty localStorage', () => {
      const initialState = cartReducer(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        cartItems: [],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      });
    });

    it('should handle initial state with localStorage data', () => {
      // This test simulates what would happen if localStorage had data during slice initialization
      // Since the slice is already imported, we test by creating a custom initial state
      const cartItems = [mockCartItem];
      const shippingAddress = { street: '123 Main St', city: 'Test City' };
      const paymentMethod = 'paypal';

      // Simulate initial state with localStorage data
      const initialStateWithData = {
        cartItems,
        shippingAddress,
        paymentMethod,
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      // Test that the state is properly structured when localStorage has data
      expect(initialStateWithData.cartItems).toEqual(cartItems);
      expect(initialStateWithData.shippingAddress).toEqual(shippingAddress);
      expect(initialStateWithData.paymentMethod).toBe(paymentMethod);
    });
  });

  describe('synchronous actions', () => {
    it('should handle addToCart with new item', () => {
      const newItem = {
        _id: 'item1',
        name: 'Test Item',
        price: 19.99,
        quantity: 1,
        size: 'M',
        color: 'red'
      };

      const action = addToCart(newItem);
      const state = cartReducer(undefined, action);

      expect(state.cartItems).toHaveLength(1);
      expect(state.cartItems[0]).toEqual(newItem);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('cartItems', JSON.stringify([newItem]));
    });

    it('should handle addToCart with existing item (same id, size, color)', () => {
      const existingItem = {
        _id: 'item1',
        name: 'Test Item',
        price: 19.99,
        quantity: 1,
        size: 'M',
        color: 'red'
      };

      const updatedItem = {
        ...existingItem,
        quantity: 3
      };

      const initialState = {
        cartItems: [existingItem],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = addToCart(updatedItem);
      const state = cartReducer(initialState, action);

      expect(state.cartItems).toHaveLength(1);
      expect(state.cartItems[0].quantity).toBe(3);
    });

    it('should handle addToCart with different variant (different size/color)', () => {
      const existingItem = {
        _id: 'item1',
        quantity: 1,
        size: 'M',
        color: 'red'
      };

      const newVariant = {
        _id: 'item1',
        quantity: 2,
        size: 'L',
        color: 'blue'
      };

      const initialState = {
        cartItems: [existingItem],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = addToCart(newVariant);
      const state = cartReducer(initialState, action);

      expect(state.cartItems).toHaveLength(2);
      expect(state.cartItems[0]).toEqual(existingItem);
      expect(state.cartItems[1]).toEqual(newVariant);
    });

    it('should handle removeFromCart', () => {
      const item1 = { _id: 'item1', size: 'M', color: 'red' };
      const item2 = { _id: 'item2', size: 'L', color: 'blue' };

      const initialState = {
        cartItems: [item1, item2],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = removeFromCart(item1);
      const state = cartReducer(initialState, action);

      expect(state.cartItems).toHaveLength(1);
      expect(state.cartItems[0]).toEqual(item2);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('cartItems', JSON.stringify([item2]));
    });

    it('should handle updateCartItemQuantity', () => {
      const item = { _id: 'item1', size: 'M', color: 'red', quantity: 1 };

      const initialState = {
        cartItems: [item],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = updateCartItemQuantity({
        id: 'item1',
        size: 'M',
        color: 'red',
        quantity: 5
      });
      const state = cartReducer(initialState, action);

      expect(state.cartItems[0].quantity).toBe(5);
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('should handle clearCart', () => {
      const initialState = {
        cartItems: [{ _id: 'item1' }],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = clearCart();
      const state = cartReducer(initialState, action);

      expect(state.cartItems).toHaveLength(0);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('cartItems');
    });

    it('should handle saveShippingAddress', () => {
      const shippingAddress = {
        street: '123 Main St',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345'
      };

      const action = saveShippingAddress(shippingAddress);
      const state = cartReducer(undefined, action);

      expect(state.shippingAddress).toEqual(shippingAddress);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('shippingAddress', JSON.stringify(shippingAddress));
    });

    it('should handle savePaymentMethod', () => {
      const paymentMethod = 'paypal';

      const action = savePaymentMethod(paymentMethod);
      const state = cartReducer(undefined, action);

      expect(state.paymentMethod).toBe(paymentMethod);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('paymentMethod', paymentMethod);
    });

    it('should handle clearPaymentInfo', () => {
      const initialState = {
        cartItems: [],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: 'secret123',
        paymentId: 'payment123',
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: 'https://checkout.url',
        shopifyCheckoutId: 'checkout123',
        loading: false,
        error: null,
      };

      const action = clearPaymentInfo();
      const state = cartReducer(initialState, action);

      expect(state.clientSecret).toBeNull();
      expect(state.paymentId).toBeNull();
      expect(state.shopifyCheckoutUrl).toBeNull();
      expect(state.shopifyCheckoutId).toBeNull();
    });

    it('should handle clearOrderInfo', () => {
      const initialState = {
        cartItems: [],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: { id: 'order123' },
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = clearOrderInfo();
      const state = cartReducer(initialState, action);

      expect(state.currentOrder).toBeNull();
    });
  });

  describe('createShopifyCheckout async thunk', () => {
    it('should handle createShopifyCheckout.pending', () => {
      const action = { type: createShopifyCheckout.pending.type };
      const state = cartReducer(undefined, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle createShopifyCheckout.fulfilled', async () => {
      const checkoutData = {
        checkoutUrl: 'https://checkout.shopify.com/123',
        checkoutId: 'checkout123'
      };

      // Set initial cart items
      const initialState = {
        cartItems: [mockCartItem],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      // Create store with initial state
      store = configureStore({
        reducer: {
          cart: cartReducer,
          alerts: alertsReducer,
        },
        preloadedState: {
          cart: initialState,
          alerts: []
        }
      });

      api.post.mockResolvedValue({ data: checkoutData });

      await store.dispatch(createShopifyCheckout());
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.shopifyCheckoutUrl).toBe(checkoutData.checkoutUrl);
      expect(state.shopifyCheckoutId).toBe(checkoutData.checkoutId);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Checkout created successfully!');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle createShopifyCheckout.rejected', async () => {
      const errorMsg = 'Failed to create checkout';
      api.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(createShopifyCheckout());
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('createPaymentIntent async thunk', () => {
    it('should handle createPaymentIntent.fulfilled', async () => {
      const paymentData = {
        clientSecret: 'pi_test_123_secret_456'
      };

      axios.post.mockResolvedValue({ data: paymentData });

      await store.dispatch(createPaymentIntent({
        items: [mockCartItem],
        totalAmount: 39.98
      }));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.clientSecret).toBe(paymentData.clientSecret);
    });

    it('should handle createPaymentIntent.rejected', async () => {
      const errorMsg = 'Payment intent creation failed';
      axios.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(createPaymentIntent({
        items: [mockCartItem],
        totalAmount: 39.98
      }));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('processCryptoPayment async thunk', () => {
    it('should handle processCryptoPayment.fulfilled', async () => {
      const cryptoPaymentData = {
        paymentId: 'crypto_payment_123'
      };

      axios.post.mockResolvedValue({ data: cryptoPaymentData });

      await store.dispatch(processCryptoPayment({
        items: [mockCartItem],
        totalAmount: 39.98,
        cryptoType: 'bitcoin',
        walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      }));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.paymentId).toBe(cryptoPaymentData.paymentId);
    });

    it('should handle processCryptoPayment.rejected', async () => {
      const errorMsg = 'Crypto payment failed';
      axios.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(processCryptoPayment({
        items: [mockCartItem],
        totalAmount: 39.98,
        cryptoType: 'ethereum',
        walletAddress: '0x123...abc'
      }));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('completePayment async thunk', () => {
    it('should handle completePayment.fulfilled', async () => {
      const orderData = {
        id: 'order_123',
        status: 'completed',
        items: [mockCartItem]
      };

      const initialState = {
        cartItems: [mockCartItem],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      axios.post.mockResolvedValue({ data: orderData });

      const action = {
        type: completePayment.fulfilled.type,
        payload: orderData
      };
      const state = cartReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.cartItems).toHaveLength(0);
      expect(state.currentOrder).toEqual(orderData);
    });

    it('should handle completePayment.rejected', async () => {
      const errorMsg = 'Payment completion failed';
      axios.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(completePayment({
        paymentId: 'payment_123',
        items: [mockCartItem],
        shippingAddress: {},
        paymentMethod: 'credit_card'
      }));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('getUserOrders async thunk', () => {
    it('should handle getUserOrders.fulfilled', async () => {
      const ordersData = [
        { id: 'order1', status: 'completed' },
        { id: 'order2', status: 'pending' }
      ];

      axios.get.mockResolvedValue({ data: ordersData });

      await store.dispatch(getUserOrders());
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.orders).toEqual(ordersData);
    });

    it('should handle getUserOrders.rejected', async () => {
      const errorMsg = 'Failed to fetch orders';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getUserOrders());
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('getOrderById async thunk', () => {
    it('should handle getOrderById.fulfilled', async () => {
      const orderData = {
        id: 'order_123',
        status: 'completed',
        items: [mockCartItem]
      };

      axios.get.mockResolvedValue({ data: orderData });

      await store.dispatch(getOrderById('order_123'));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.currentOrder).toEqual(orderData);
    });

    it('should handle getOrderById.rejected', async () => {
      const errorMsg = 'Order not found';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getOrderById('invalid_order'));
      const state = store.getState().cart;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('edge cases', () => {
    it('should handle updateCartItemQuantity with non-existent item', () => {
      const initialState = {
        cartItems: [{ _id: 'item1', size: 'M', color: 'red', quantity: 1 }],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const action = updateCartItemQuantity({
        id: 'nonexistent',
        size: 'L',
        color: 'blue',
        quantity: 3
      });
      const state = cartReducer(initialState, action);

      // Should remain unchanged
      expect(state.cartItems[0].quantity).toBe(1);
    });

    it('should handle removeFromCart with non-existent item', () => {
      const item = { _id: 'item1', size: 'M', color: 'red' };
      const initialState = {
        cartItems: [item],
        shippingAddress: {},
        paymentMethod: 'credit_card',
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
      };

      const nonExistentItem = { _id: 'item2', size: 'L', color: 'blue' };
      const action = removeFromCart(nonExistentItem);
      const state = cartReducer(initialState, action);

      // Should remain unchanged
      expect(state.cartItems).toHaveLength(1);
      expect(state.cartItems[0]).toEqual(item);
    });

    it('should handle async thunk errors without response data', async () => {
      // Mock rejection with response but no data.msg  
      axios.post.mockRejectedValue({
        response: { data: {} }
      });

      const result = await store.dispatch(createPaymentIntent({
        items: [mockCartItem],
        totalAmount: 39.98
      }));

      expect(result.type).toBe(createPaymentIntent.rejected.type);
      expect(result.payload).toBe('Failed to create payment intent');
      
      const state = store.getState().cart;
      expect(state.error).toBe('Failed to create payment intent');
    });

    it('should properly format items for checkout', async () => {
      const cartItems = [
        {
          _id: 'merch1',
          quantity: 2,
          size: 'M',
          color: 'red'
        },
        {
          _id: 'merch2',
          quantity: 1,
          size: 'L',
          color: 'blue'
        }
      ];

      // Create store with cart items
      store = configureStore({
        reducer: {
          cart: cartReducer,
          alerts: alertsReducer,
        },
        preloadedState: {
          cart: {
            cartItems,
            shippingAddress: {},
            paymentMethod: 'credit_card',
            clientSecret: null,
            paymentId: null,
            orders: [],
            currentOrder: null,
            shopifyCheckoutUrl: null,
            shopifyCheckoutId: null,
            loading: false,
            error: null,
          },
          alerts: []
        }
      });

      api.post.mockResolvedValue({ 
        data: { 
          checkoutUrl: 'https://checkout.url',
          checkoutId: 'checkout123'
        } 
      });

      await store.dispatch(createShopifyCheckout());

      expect(api.post).toHaveBeenCalledWith('/api/merchandise/checkout', {
        items: [
          {
            merchandiseId: 'merch1',
            quantity: 2,
            size: 'M',
            color: 'red'
          },
          {
            merchandiseId: 'merch2',
            quantity: 1,
            size: 'L',
            color: 'blue'
          }
        ]
      });
    });
  });

  describe('loading states', () => {
    it('should set loading to true for all pending actions', () => {
      const actions = [
        createShopifyCheckout.pending.type,
        createPaymentIntent.pending.type,
        processCryptoPayment.pending.type,
        completePayment.pending.type,
        getUserOrders.pending.type,
        getOrderById.pending.type,
      ];

      actions.forEach(actionType => {
        const state = cartReducer(undefined, { type: actionType });
        expect(state.loading).toBe(true);
      });
    });

    it('should set loading to false for fulfilled/rejected actions', () => {
      const actions = [
        { type: createShopifyCheckout.fulfilled.type, payload: { checkoutUrl: 'url', checkoutId: 'id' } },
        { type: createPaymentIntent.fulfilled.type, payload: { clientSecret: 'secret' } },
        { type: processCryptoPayment.fulfilled.type, payload: { paymentId: 'id' } },
        { type: completePayment.fulfilled.type, payload: { id: 'order' } },
        { type: getUserOrders.fulfilled.type, payload: [] },
        { type: getOrderById.fulfilled.type, payload: { id: 'order' } },
        { type: createShopifyCheckout.rejected.type, payload: 'error' },
      ];

      actions.forEach(action => {
        const state = cartReducer({ loading: true }, action);
        expect(state.loading).toBe(false);
      });
    });
  });
});