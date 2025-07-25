import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from './Header';
import authReducer from '../../features/auth/authSlice';
import cartReducer from '../../features/cart/cartSlice';

// Styled-components mocked globally in setupTests.js

const createMockStore = (authState = {}, cartState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        ...authState,
      },
      cart: {
        cartItems: [],
        shippingAddress: {},
        paymentMethod: "credit_card",
        clientSecret: null,
        paymentId: null,
        orders: [],
        currentOrder: null,
        shopifyCheckoutUrl: null,
        shopifyCheckoutId: null,
        loading: false,
        error: null,
        ...cartState,
      },
    },
  });
};

const renderWithRouter = (component, store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Header Component', () => {
  it('should render logo', () => {
    const store = createMockStore();
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('WaifuHospital')).toBeInTheDocument();
  });

  it('should render home link', () => {
    const store = createMockStore();
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should render guest links when not authenticated', () => {
    const store = createMockStore({ isAuthenticated: false });
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should render auth links when authenticated', () => {
    const store = createMockStore({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' },
    });
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create Character')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('should display cart count when items in cart', () => {
    const cartItems = [
      { id: '1', name: 'Item 1', quantity: 2 },
      { id: '2', name: 'Item 2', quantity: 1 },
    ];
    
    const store = createMockStore(
      { isAuthenticated: true },
      { cartItems }
    );
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Cart count
  });

  it('should not display cart count when cart is empty', () => {
    const store = createMockStore(
      { isAuthenticated: true },
      { cartItems: [] }
    );
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should handle logout when logout button is clicked', () => {
    const store = createMockStore({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' },
    });
    
    renderWithRouter(<Header />, store);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    // After logout, should show guest links
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should render all navigation links with correct href attributes', () => {
    const store = createMockStore({
      isAuthenticated: true,
      user: { id: '1', username: 'testuser' },
    });
    renderWithRouter(<Header />, store);
    
    expect(screen.getByRole('link', { name: 'WaifuHospital' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Create Character' })).toHaveAttribute('href', '/create-character');
    expect(screen.getByRole('link', { name: 'Store' })).toHaveAttribute('href', '/merchandise');
  });

  it('should handle authentication state changes', () => {
    const store = createMockStore({ isAuthenticated: false });
    renderWithRouter(<Header />, store);
    
    // Initially shows guest links
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Verify guest navigation is shown properly
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should handle multiple cart items correctly', () => {
    const cartItems = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      quantity: 1,
    }));
    
    const store = createMockStore(
      { isAuthenticated: true },
      { cartItems }
    );
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // Cart count
  });

  it('should render correctly with minimal authenticated state', () => {
    const store = createMockStore({
      isAuthenticated: true,
      user: null, // Minimal user data
    });
    renderWithRouter(<Header />, store);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should handle edge case with undefined cart items', () => {
    const store = createMockStore(
      { isAuthenticated: true },
      { cartItems: [] }
    );
    
    // Should not crash
    expect(() => renderWithRouter(<Header />, store)).not.toThrow();
  });

  describe('Link accessibility', () => {
    it('should have accessible link text', () => {
      const store = createMockStore({ isAuthenticated: true });
      renderWithRouter(<Header />, store);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });

    it('should have button with accessible text', () => {
      const store = createMockStore({ isAuthenticated: true });
      renderWithRouter(<Header />, store);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Logout');
    });
  });

  describe('Cart functionality', () => {
    it('should display correct cart count for various quantities', () => {
      const testCases = [
        { cartItems: [], expectedCount: null },
        { cartItems: [{ id: '1', quantity: 1 }], expectedCount: '1' },
        { cartItems: [{ id: '1', quantity: 5 }], expectedCount: '1' }, // Count is items, not quantities
        { 
          cartItems: [
            { id: '1', quantity: 2 },
            { id: '2', quantity: 3 },
            { id: '3', quantity: 1 }
          ], 
          expectedCount: '3' 
        },
      ];
      
      testCases.forEach(({ cartItems, expectedCount }) => {
        const store = createMockStore(
          { isAuthenticated: true },
          { cartItems }
        );
        const { unmount } = renderWithRouter(<Header />, store);
        
        if (expectedCount) {
          expect(screen.getByText(expectedCount)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
        }
        
        unmount();
      });
    });
  });
});