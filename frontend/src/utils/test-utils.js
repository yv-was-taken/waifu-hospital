import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../features/auth/authSlice';
import alertSlice from '../features/alerts/alertSlice';
import characterSlice from '../features/characters/characterSlice';
import cartSlice from '../features/cart/cartSlice';
import merchandiseSlice from '../features/merchandise/merchandiseSlice';

// Create a custom render function that includes providers
const customRender = (
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authSlice,
        alerts: alertSlice,
        characters: characterSlice,
        cart: cartSlice,
        merchandise: merchandiseSlice,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Create a store for testing
export const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      alerts: alertSlice,
      characters: characterSlice,
      cart: cartSlice,
      merchandise: merchandiseSlice,
    },
    preloadedState,
  });
};

// Mock user data for testing
export const mockUser = {
  id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  profilePicture: 'https://example.com/avatar.jpg',
  characters: [],
  paymentHistory: [],
};

// Mock character data for testing
export const mockCharacter = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Character',
  description: 'A test character for testing purposes',
  personality: 'Friendly and helpful',
  imageUrl: 'https://example.com/character.jpg',
  public: true,
  creator: {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
  },
  likes: 5,
  createdAt: '2023-01-01T00:00:00.000Z',
};

// Mock merchandise data for testing
export const mockMerchandise = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Test Merchandise',
  description: 'A test merchandise item',
  price: 19.99,
  imageUrl: 'https://example.com/merch.jpg',
  character: mockCharacter._id,
  creator: mockUser.id,
  category: 't-shirt',
  stock: 100,
  sold: 0,
  isApproved: true,
};

// Mock cart item for testing
export const mockCartItem = {
  merchandise: mockMerchandise,
  quantity: 2,
  selectedSize: 'M',
  selectedColor: 'black',
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };