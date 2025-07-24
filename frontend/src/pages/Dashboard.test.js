import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from './Dashboard';
import authReducer from '../features/auth/authSlice';
import characterReducer from '../features/characters/characterSlice';
import merchandiseReducer from '../features/merchandise/merchandiseSlice';
import cartReducer from '../features/cart/cartSlice';

// Mock the Spinner component
jest.mock('../components/layout/Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

const createMockStore = (authState = {}, characterState = {}, merchandiseState = {}, cartState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      character: characterReducer,
      merchandise: merchandiseReducer,
      cart: cartReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: '1', username: 'testuser' },
        token: 'token',
        loading: false,
        ...authState,
      },
      character: {
        characters: [],
        userCharacters: [],
        popularCharacters: [],
        character: null,
        loading: false,
        error: null,
        ...characterState,
      },
      merchandise: {
        merchandise: [],
        creatorMerchandise: [],
        loading: false,
        error: null,
        ...merchandiseState,
      },
      cart: {
        items: [],
        orders: [],
        totalAmount: 0,
        loading: false,
        error: null,
        ...cartState,
      },
    },
  });
};

const mockCharacters = [
  {
    _id: '1',
    name: 'Test Character 1',
    imageUrl: 'https://example.com/image1.jpg',
    personality: 'A cheerful and optimistic character who loves to help others and make new friends.',
  },
  {
    _id: '2',
    name: 'Test Character 2',
    imageUrl: 'https://example.com/image2.jpg',
    personality: 'A mysterious and elegant character with a deep knowledge of ancient secrets.',
  },
];

const mockMerchandise = [
  {
    _id: '1',
    name: 'Character T-Shirt',
    imageUrl: 'https://example.com/shirt.jpg',
    price: 24.99,
    sold: 15,
  },
  {
    _id: '2',
    name: 'Character Mug',
    imageUrl: 'https://example.com/mug.jpg',
    price: 12.99,
    sold: 8,
  },
];

const mockOrders = [
  {
    _id: '641234567890abcdef123456',
    items: [{ name: 'Test Item 1' }, { name: 'Test Item 2' }],
    totalAmount: 45.99,
    status: 'completed',
  },
  {
    _id: '641234567890abcdef654321',
    items: [{ name: 'Test Item 3' }],
    totalAmount: 19.99,
    status: 'pending',
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

describe('Dashboard Component', () => {
  describe('Initial render', () => {
    it('should render dashboard title and header', () => {
      const store = createMockStore();
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create Character' })).toBeInTheDocument();
    });

    it('should render all main sections', () => {
      const store = createMockStore();
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByRole('heading', { name: 'My Characters' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My Merchandise' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My Orders' })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const store = createMockStore();
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'My Characters' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'My Merchandise' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'My Orders' })).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show spinner when auth is loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
    });

    it('should show spinner when characters are loading', () => {
      const store = createMockStore({}, { loading: true });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show spinner when merchandise is loading', () => {
      const store = createMockStore({}, {}, { loading: true });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show spinner when orders are loading', () => {
      const store = createMockStore({}, {}, {}, { loading: true });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show spinner when multiple sections are loading', () => {
      const store = createMockStore(
        { loading: true },
        { loading: true },
        { loading: true },
        { loading: true }
      );
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('Characters section', () => {
    it('should display user characters when available', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
      expect(screen.getByText('Test Character 2')).toBeInTheDocument();
    });

    it('should display character images with proper alt text', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      const images = screen.getAllByRole('img');
      const characterImages = images.filter(img => 
        img.getAttribute('alt') === 'Test Character 1' || 
        img.getAttribute('alt') === 'Test Character 2'
      );
      
      expect(characterImages).toHaveLength(2);
      expect(characterImages[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(characterImages[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
    });

    it('should truncate character personality text', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText(/A cheerful and optimistic character who loves to help others and make new friends/)).toBeInTheDocument();
      expect(screen.getByText(/A mysterious and elegant character with a deep knowledge of ancient secrets/)).toBeInTheDocument();
    });

    it('should create links to character detail pages', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      const characterLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href') === '/characters/1' || 
        link.getAttribute('href') === '/characters/2'
      );
      
      expect(characterLinks).toHaveLength(2);
    });

    it('should show empty message when no characters exist', () => {
      const store = createMockStore({}, { userCharacters: [] });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't created any characters yet.")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create your first character!' })).toBeInTheDocument();
    });

    it('should handle undefined userCharacters', () => {
      const store = createMockStore({}, { userCharacters: undefined });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't created any characters yet.")).toBeInTheDocument();
    });
  });

  describe('Merchandise section', () => {
    it('should display creator merchandise when available', () => {
      const store = createMockStore({}, {}, { creatorMerchandise: mockMerchandise });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('Character T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Character Mug')).toBeInTheDocument();
    });

    it('should display merchandise prices and sales data', () => {
      const store = createMockStore({}, {}, { creatorMerchandise: mockMerchandise });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('$24.99')).toBeInTheDocument();
      expect(screen.getByText('$12.99')).toBeInTheDocument();
      expect(screen.getByText('Sold: 15')).toBeInTheDocument();
      expect(screen.getByText('Sold: 8')).toBeInTheDocument();
    });

    it('should create links to merchandise detail pages', () => {
      const store = createMockStore({}, {}, { creatorMerchandise: mockMerchandise });
      renderWithProviders(<Dashboard />, store);
      
      const merchandiseLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href') === '/merchandise/1' || 
        link.getAttribute('href') === '/merchandise/2'
      );
      
      expect(merchandiseLinks).toHaveLength(2);
    });

    it('should show appropriate empty message when user has characters but no merchandise', () => {
      const store = createMockStore(
        {},
        { userCharacters: mockCharacters },
        { creatorMerchandise: [] }
      );
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't created any merchandise yet.")).toBeInTheDocument();
      expect(screen.getByText("Go to one of your characters to create merchandise.")).toBeInTheDocument();
    });

    it('should show different empty message when user has no characters', () => {
      const store = createMockStore(
        {},
        { userCharacters: [] },
        { creatorMerchandise: [] }
      );
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't created any merchandise yet.")).toBeInTheDocument();
      expect(screen.getByText("Create a character first to start selling merchandise.")).toBeInTheDocument();
    });
  });

  describe('Orders section', () => {
    it('should display user orders when available', () => {
      const store = createMockStore({}, {}, {}, { orders: mockOrders });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('Order #123456')).toBeInTheDocument();
      expect(screen.getByText('Order #654321')).toBeInTheDocument();
    });

    it('should display order details', () => {
      const store = createMockStore({}, {}, {}, { orders: mockOrders });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('Items: 2')).toBeInTheDocument();
      expect(screen.getByText('Items: 1')).toBeInTheDocument();
      expect(screen.getByText('Total: $45.99')).toBeInTheDocument();
      expect(screen.getByText('Total: $19.99')).toBeInTheDocument();
      expect(screen.getByText('Status: completed')).toBeInTheDocument();
      expect(screen.getByText('Status: pending')).toBeInTheDocument();
    });

    it('should create View Details buttons for each order', () => {
      const store = createMockStore({}, {}, {}, { orders: mockOrders });
      renderWithProviders(<Dashboard />, store);
      
      const viewButtons = screen.getAllByRole('button', { name: 'View Details' });
      expect(viewButtons).toHaveLength(2);
    });

    it('should create links to order detail pages', () => {
      const store = createMockStore({}, {}, {}, { orders: mockOrders });
      renderWithProviders(<Dashboard />, store);
      
      const orderLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href') === '/orders/641234567890abcdef123456' || 
        link.getAttribute('href') === '/orders/641234567890abcdef654321'
      );
      
      expect(orderLinks).toHaveLength(2);
    });

    it('should show empty message when no orders exist', () => {
      const store = createMockStore({}, {}, {}, { orders: [] });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse the store' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse the store' })).toHaveAttribute('href', '/merchandise');
    });

    it('should handle undefined orders', () => {
      const store = createMockStore({}, {}, {}, { orders: undefined });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
    });
  });

  describe('User authentication', () => {
    it('should show create button when user is authenticated', () => {
      const store = createMockStore({ user: { id: '1', username: 'testuser' } });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByRole('link', { name: 'Create Character' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create Character' })).toHaveAttribute('href', '/create-character');
    });

    it('should not show create button when user is null', () => {
      const store = createMockStore({ user: null });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.queryByRole('link', { name: 'Create Character' })).not.toBeInTheDocument();
    });

    it('should handle undefined user gracefully', () => {
      const store = createMockStore({ user: undefined });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.queryByRole('link', { name: 'Create Character' })).not.toBeInTheDocument();
    });
  });

  describe('Redux integration', () => {
    it('should dispatch required actions on mount', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<Dashboard />, store);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'character/getUserCharacters/pending'
          })
        );
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'merchandise/getCreatorMerchandise/pending'
          })
        );
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'cart/getUserOrders/pending'
          })
        );
      });
    });

    it('should respond to data updates', () => {
      const store = createMockStore({}, { userCharacters: [] });
      const { rerender } = renderWithProviders(<Dashboard />, store);
      
      // Initially shows empty state
      expect(screen.getByText("You haven't created any characters yet.")).toBeInTheDocument();
      
      // Update store with characters
      store.dispatch({
        type: 'character/getUserCharacters/fulfilled',
        payload: mockCharacters
      });
      
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </Provider>
      );
      
      // Should now show characters
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA structure', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    });

    it('should have accessible image alt text', () => {
      const store = createMockStore({}, { userCharacters: mockCharacters });
      renderWithProviders(<Dashboard />, store);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should have accessible navigation links', () => {
      const store = createMockStore(
        { user: { id: '1' } },
        { userCharacters: mockCharacters },
        { creatorMerchandise: mockMerchandise },
        { orders: mockOrders }
      );
      renderWithProviders(<Dashboard />, store);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });

    it('should have accessible buttons', () => {
      const store = createMockStore({}, {}, {}, { orders: mockOrders });
      renderWithProviders(<Dashboard />, store);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string data gracefully', () => {
      const emptyCharacters = [
        {
          _id: '1',
          name: '',
          imageUrl: '',
          personality: '',
        },
      ];
      
      const store = createMockStore({}, { userCharacters: emptyCharacters });
      
      expect(() => {
        renderWithProviders(<Dashboard />, store);
      }).not.toThrow();
    });

    it('should handle missing character properties', () => {
      const incompleteCharacters = [
        {
          _id: '1',
          name: 'Test Character',
          // missing imageUrl and personality
        },
      ];
      
      const store = createMockStore({}, { userCharacters: incompleteCharacters });
      
      expect(() => {
        renderWithProviders(<Dashboard />, store);
      }).not.toThrow();
    });

    it('should handle very long character personalities', () => {
      const longPersonalityCharacter = [
        {
          _id: '1',
          name: 'Test Character',
          imageUrl: 'https://example.com/image.jpg',
          personality: 'A'.repeat(500), // Very long personality
        },
      ];
      
      const store = createMockStore({}, { userCharacters: longPersonalityCharacter });
      renderWithProviders(<Dashboard />, store);
      
      // Should truncate the personality
      const personalityText = screen.getByText(/A{10,}/);
      expect(personalityText.textContent.length).toBeLessThan(500);
    });

    it('should handle order ID edge cases', () => {
      const shortOrderId = [
        {
          _id: '123',
          items: [{ name: 'Test Item' }],
          totalAmount: 10.00,
          status: 'completed',
        },
      ];
      
      const store = createMockStore({}, {}, {}, { orders: shortOrderId });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('Order #123')).toBeInTheDocument();
    });

    it('should handle zero prices and sales', () => {
      const zeroMerchandise = [
        {
          _id: '1',
          name: 'Free Item',
          imageUrl: 'https://example.com/free.jpg',
          price: 0,
          sold: 0,
        },
      ];
      
      const store = createMockStore({}, {}, { creatorMerchandise: zeroMerchandise });
      renderWithProviders(<Dashboard />, store);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('Sold: 0')).toBeInTheDocument();
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      const manyCharacters = Array.from({ length: 50 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Character ${i + 1}`,
        imageUrl: `https://example.com/image${i + 1}.jpg`,
        personality: `Personality for character ${i + 1}`,
      }));
      
      const store = createMockStore({}, { userCharacters: manyCharacters });
      
      expect(() => {
        renderWithProviders(<Dashboard />, store);
      }).not.toThrow();
      
      // Should render all characters
      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 50')).toBeInTheDocument();
    });
  });
});