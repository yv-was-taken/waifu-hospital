import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Cart from './Cart';
import cartReducer from '../features/cart/cartSlice';
import alertReducer from '../features/alerts/alertSlice';

// Mock the Spinner component
jest.mock('../components/layout/Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock API calls
import api from '../utils/api';
jest.mock('../utils/api');
const mockApi = api;

const createMockStore = (cartState = {}, alertState = []) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      alert: alertReducer,
    },
    preloadedState: {
      cart: {
        items: [],
        cartItems: [],
        orders: [],
        totalAmount: 0,
        loading: false,
        error: null,
        ...cartState,
      },
      alert: alertState,
    },
  });
};

const mockCartItems = [
  {
    _id: '1',
    name: 'Character T-Shirt',
    imageUrl: 'https://example.com/shirt.jpg',
    price: 24.99,
    quantity: 2,
    size: 'M',
    color: '#FF6B81',
    category: 'Apparel',
  },
  {
    _id: '2',
    name: 'Character Mug',
    imageUrl: 'https://example.com/mug.jpg',
    price: 12.99,
    quantity: 1,
    size: 'N/A',
    color: '#4ECDC4',
    category: 'Accessories',
  },
];

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Cart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful API responses
    mockApi.post.mockResolvedValue({
      data: {
        success: true,
        checkoutUrl: 'https://checkout.example.com'
      }
    });
  });

  describe('Loading state', () => {
    it('should show spinner when loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByText('Your Cart')).not.toBeInTheDocument();
    });
  });

  describe('Empty cart', () => {
    it('should render empty cart message when no items', () => {
      const store = createMockStore({ cartItems: [] });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
      expect(screen.getByText("Looks like you haven't added any items to your cart yet.")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Shop Now' })).toBeInTheDocument();
    });

    it('should have shop now link pointing to merchandise', () => {
      const store = createMockStore({ cartItems: [] });
      renderWithProviders(<Cart />, store);
      
      const shopLink = screen.getByRole('link', { name: 'Shop Now' });
      expect(shopLink).toHaveAttribute('href', '/merchandise');
    });
  });

  describe('Cart with items', () => {
    it('should render cart title with item count', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('heading', { name: 'Your Cart (2 items)' })).toBeInTheDocument();
    });

    it('should render singular form for single item', () => {
      const store = createMockStore({ cartItems: [mockCartItems[0]] });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('heading', { name: 'Your Cart (1 item)' })).toBeInTheDocument();
    });

    it('should render all cart items', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('Character T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Character Mug')).toBeInTheDocument();
    });

    it('should render item images with alt text', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/shirt.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Character T-Shirt');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/mug.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Character Mug');
    });

    it('should render item details and metadata', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('Apparel')).toBeInTheDocument();
      expect(screen.getByText('Size: M')).toBeInTheDocument();
      expect(screen.getByText('Accessories')).toBeInTheDocument();
      expect(screen.getAllByText('Color')).toHaveLength(2);
    });

    it('should not show size for N/A size items', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('Size: M')).toBeInTheDocument();
      expect(screen.queryByText('Size: N/A')).not.toBeInTheDocument();
    });

    it('should render item prices with quantity calculation', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      // T-shirt: $24.99 * 2 = $49.98
      expect(screen.getByText('$49.98')).toBeInTheDocument();
      // Mug: $12.99 * 1 = $12.99
      expect(screen.getByText('$12.99')).toBeInTheDocument();
    });

    it('should create links to item detail pages', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const itemLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href') === '/merchandise/1' || 
        link.getAttribute('href') === '/merchandise/2'
      );
      
      expect(itemLinks).toHaveLength(2);
    });
  });

  describe('Quantity controls', () => {
    it('should render quantity controls for each item', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const minusButtons = screen.getAllByRole('button', { name: '-' });
      const plusButtons = screen.getAllByRole('button', { name: '+' });
      const quantityInputs = screen.getAllByDisplayValue(/[0-9]+/);
      
      expect(minusButtons).toHaveLength(2);
      expect(plusButtons).toHaveLength(2);
      expect(quantityInputs).toHaveLength(2);
    });

    it('should display correct quantities', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should disable minus button when quantity is 1', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const minusButtons = screen.getAllByRole('button', { name: '-' });
      
      // First item has quantity 2, should not be disabled
      expect(minusButtons[0]).not.toBeDisabled();
      // Second item has quantity 1, should be disabled
      expect(minusButtons[1]).toBeDisabled();
    });

    it('should dispatch updateCartItemQuantity when plus button is clicked', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const plusButtons = screen.getAllByRole('button', { name: '+' });
      fireEvent.click(plusButtons[0]);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/updateCartItemQuantity',
            payload: {
              id: '1',
              size: 'M',
              color: '#FF6B81',
              quantity: 3,
            }
          })
        );
      });
    });

    it('should dispatch updateCartItemQuantity when minus button is clicked', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const minusButtons = screen.getAllByRole('button', { name: '-' });
      fireEvent.click(minusButtons[0]);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/updateCartItemQuantity',
            payload: {
              id: '1',
              size: 'M',
              color: '#FF6B81',
              quantity: 1,
            }
          })
        );
      });
    });

    it('should handle direct quantity input change', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const quantityInputs = screen.getAllByDisplayValue(/[0-9]+/);
      fireEvent.change(quantityInputs[0], { target: { value: '5' } });
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/updateCartItemQuantity',
            payload: {
              id: '1',
              size: 'M',
              color: '#FF6B81',
              quantity: 5,
            }
          })
        );
      });
    });

    it('should disable plus button when quantity reaches 100', () => {
      const highQuantityItem = [
        {
          ...mockCartItems[0],
          quantity: 100,
        },
      ];
      
      const store = createMockStore({ cartItems: highQuantityItem });
      renderWithProviders(<Cart />, store);
      
      const plusButton = screen.getByRole('button', { name: '+' });
      expect(plusButton).toBeDisabled();
    });

    it('should not update quantity for invalid values', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const quantityInputs = screen.getAllByDisplayValue(/[0-9]+/);
      
      // Test invalid values
      fireEvent.change(quantityInputs[0], { target: { value: '0' } });
      fireEvent.change(quantityInputs[0], { target: { value: '-5' } });
      fireEvent.change(quantityInputs[0], { target: { value: '101' } });
      fireEvent.change(quantityInputs[0], { target: { value: 'abc' } });
      
      // Should not dispatch any update actions for invalid values
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cart/updateCartItemQuantity'
        })
      );
    });
  });

  describe('Remove items', () => {
    it('should render remove buttons for each item', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      expect(removeButtons).toHaveLength(2);
    });

    it('should dispatch removeFromCart when remove button is clicked', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      fireEvent.click(removeButtons[0]);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/removeFromCart',
            payload: mockCartItems[0]
          })
        );
      });
    });

    it('should show success alert when item is removed', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      fireEvent.click(removeButtons[0]);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'alert/setAlert',
            payload: expect.objectContaining({
              msg: 'Item removed from cart',
              type: 'success'
            })
          })
        );
      });
    });
  });

  describe('Order summary', () => {
    it('should render order summary section', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
    });

    it('should calculate and display subtotal correctly', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      // Subtotal: $24.99 * 2 + $12.99 * 1 = $62.97
      expect(screen.getByText('$62.97')).toBeInTheDocument();
    });

    it('should display shipping cost', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('$5.99')).toBeInTheDocument();
    });

    it('should calculate and display tax', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('Tax (8%)')).toBeInTheDocument();
      // Tax: $62.97 * 0.08 = $5.04
      expect(screen.getByText('$5.04')).toBeInTheDocument();
    });

    it('should calculate and display total', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      // Total: $62.97 + $5.99 + $5.04 = $74.00
      expect(screen.getByText('$74.00')).toBeInTheDocument();
    });

    it('should not charge shipping for empty cart', () => {
      const store = createMockStore({ cartItems: [] });
      renderWithProviders(<Cart />, store);
      
      // Should show empty cart, not order summary
      expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
    });
  });

  describe('Checkout and clear cart', () => {
    it('should render checkout button', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
    });

    it('should navigate to checkout when checkout button is clicked', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const checkoutButton = screen.getByRole('button', { name: 'Proceed to Checkout' });
      fireEvent.click(checkoutButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });

    it('should render clear cart button', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('button', { name: 'Clear Cart' })).toBeInTheDocument();
    });

    it('should dispatch clearCart when clear cart button is clicked', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const clearButton = screen.getByRole('button', { name: 'Clear Cart' });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/clearCart'
          })
        );
      });
    });

    it('should show success alert when cart is cleared', async () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Cart />, store);
      
      const clearButton = screen.getByRole('button', { name: 'Clear Cart' });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'alert/setAlert',
            payload: expect.objectContaining({
              msg: 'Cart cleared',
              type: 'success'
            })
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Order Summary' })).toBeInTheDocument();
    });

    it('should have accessible form controls', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const quantityInputs = screen.getAllByRole('spinbutton');
      quantityInputs.forEach(input => {
        expect(input).toHaveAttribute('min', '1');
        expect(input).toHaveAttribute('max', '100');
      });
    });

    it('should have accessible buttons', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });

    it('should have accessible images', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should have accessible navigation links', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      renderWithProviders(<Cart />, store);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent(/\S/);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle items with missing properties', () => {
      const incompleteItems = [
        {
          _id: '1',
          name: 'Incomplete Item',
          price: 10.00,
          quantity: 1,
          // missing imageUrl, size, color, category
        },
      ];
      
      const store = createMockStore({ cartItems: incompleteItems });
      
      expect(() => {
        renderWithProviders(<Cart />, store);
      }).not.toThrow();
    });

    it('should handle zero price items', () => {
      const freeItems = [
        {
          _id: '1',
          name: 'Free Item',
          imageUrl: 'https://example.com/free.jpg',
          price: 0,
          quantity: 1,
          size: 'M',
          color: '#000000',
          category: 'Free',
        },
      ];
      
      const store = createMockStore({ cartItems: freeItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getAllByText('$0.00')).toHaveLength(5); // Item price, subtotal, shipping, tax, total
    });

    it('should handle large quantities correctly', () => {
      const largeQuantityItems = [
        {
          ...mockCartItems[0],
          quantity: 99,
        },
      ];
      
      const store = createMockStore({ cartItems: largeQuantityItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByDisplayValue('99')).toBeInTheDocument();
      // Price should be calculated correctly: $24.99 * 99 = $2474.01
      expect(screen.getAllByText('$2474.01')).toHaveLength(2); // Appears in subtotal and item total
    });

    it('should handle very long item names', () => {
      const longNameItems = [
        {
          ...mockCartItems[0],
          name: 'A'.repeat(100),
        },
      ];
      
      const store = createMockStore({ cartItems: longNameItems });
      renderWithProviders(<Cart />, store);
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should generate unique keys for duplicate items with different variants', () => {
      const duplicateItems = [
        { ...mockCartItems[0], size: 'S', color: '#FF0000' },
        { ...mockCartItems[0], size: 'M', color: '#00FF00' },
        { ...mockCartItems[0], size: 'L', color: '#0000FF' },
      ];
      
      const store = createMockStore({ cartItems: duplicateItems });
      
      expect(() => {
        renderWithProviders(<Cart />, store);
      }).not.toThrow();
      
      expect(screen.getAllByText('Character T-Shirt')).toHaveLength(3);
    });
  });

  describe('Responsive behavior', () => {
    it('should render cart layout components', () => {
      const store = createMockStore({ cartItems: mockCartItems });
      const { container } = renderWithProviders(<Cart />, store);
      
      // Check that main sections are rendered
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Performance considerations', () => {
    it('should handle large cart efficiently', () => {
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Item ${i + 1}`,
        imageUrl: `https://example.com/item${i + 1}.jpg`,
        price: 10.00 + i,
        quantity: 1,
        size: 'M',
        color: '#FF6B81',
        category: 'Test',
      }));
      
      const store = createMockStore({ cartItems: manyItems });
      
      expect(() => {
        renderWithProviders(<Cart />, store);
      }).not.toThrow();
      
      expect(screen.getByText('Your Cart (50 items)')).toBeInTheDocument();
    });
  });
});