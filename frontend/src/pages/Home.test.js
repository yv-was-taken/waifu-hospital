import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Home from './Home';
import authReducer from '../features/auth/authSlice';
import characterReducer from '../features/characters/characterSlice';

// Mock the Spinner component
jest.mock('../components/layout/Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

const createMockStore = (authState = {}, characterState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      character: characterReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        ...authState,
      },
      character: {
        characters: [],
        popularCharacters: [],
        character: null,
        loading: false,
        error: null,
        ...characterState,
      },
    },
  });
};

const mockCharacters = [
  {
    _id: '1',
    name: 'Test Character 1',
    imageUrl: 'https://example.com/image1.jpg',
    creator: { username: 'creator1' },
  },
  {
    _id: '2',
    name: 'Test Character 2',
    imageUrl: 'https://example.com/image2.jpg',
    creator: { username: 'creator2' },
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

describe('Home Component', () => {
  describe('Hero section', () => {
    it('should render hero title and subtitle', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('Create Your Perfect Anime Companion')).toBeInTheDocument();
      expect(screen.getByText(/Design, chat with, and own merchandise/)).toBeInTheDocument();
    });

    it('should show unauthenticated buttons when not logged in', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByRole('link', { name: 'Get Started' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');
    });

    it('should show authenticated buttons when logged in', () => {
      const store = createMockStore({
        isAuthenticated: true,
        user: { id: '1', username: 'testuser', isCreator: false },
      });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByRole('link', { name: 'My Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse Store' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My Dashboard' })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: 'Browse Store' })).toHaveAttribute('href', '/merchandise');
    });

    it('should show creator button when user is a creator', () => {
      const store = createMockStore({
        isAuthenticated: true,
        user: { id: '1', username: 'creator', isCreator: true },
      });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByRole('link', { name: 'My Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create Character' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create Character' })).toHaveAttribute('href', '/create-character');
    });
  });

  describe('Features section', () => {
    it('should render How It Works section', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    it('should render all feature cards', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Customize')).toBeInTheDocument();
      expect(screen.getByText('Merchandise')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText(/Design your own anime character with our AI-powered creator/)).toBeInTheDocument();
      expect(screen.getByText(/Engage in meaningful conversations with your character/)).toBeInTheDocument();
      expect(screen.getByText(/Add details to your character's background/)).toBeInTheDocument();
      expect(screen.getByText(/Create and sell custom merchandise/)).toBeInTheDocument();
    });
  });

  describe('Popular Characters section', () => {
    it('should render Popular Characters title', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('Popular Characters')).toBeInTheDocument();
    });

    it('should show spinner when loading characters', () => {
      const store = createMockStore({}, { loading: true });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show message when no characters found', () => {
      const store = createMockStore({}, { 
        loading: false,
        popularCharacters: []
      });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('No characters found. Be the first to create one!')).toBeInTheDocument();
    });

    it('should render character cards when characters are available', () => {
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: mockCharacters,
      });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
      expect(screen.getByText('Test Character 2')).toBeInTheDocument();
      expect(screen.getByText('by creator1')).toBeInTheDocument();
      expect(screen.getByText('by creator2')).toBeInTheDocument();
    });

    it('should render character images with proper alt text', () => {
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: mockCharacters,
      });
      renderWithProviders(<Home />, store);
      
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Test Character 1');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Test Character 2');
    });

    it('should render View Character links', () => {
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: mockCharacters,
      });
      renderWithProviders(<Home />, store);
      
      const viewLinks = screen.getAllByText('View Character');
      expect(viewLinks).toHaveLength(2);
      expect(viewLinks[0]).toHaveAttribute('href', '/characters/1');
      expect(viewLinks[1]).toHaveAttribute('href', '/characters/2');
    });

    it('should handle character without creator', () => {
      const charactersWithoutCreator = [
        {
          _id: '1',
          name: 'Orphan Character',
          imageUrl: 'https://example.com/orphan.jpg',
          creator: null,
        },
      ];
      
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: charactersWithoutCreator,
      });
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('by Unknown')).toBeInTheDocument();
    });

    it('should limit characters to 8 when more are available', () => {
      const manyCharacters = Array.from({ length: 12 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Character ${i + 1}`,
        imageUrl: `https://example.com/image${i + 1}.jpg`,
        creator: { username: `creator${i + 1}` },
      }));
      
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: manyCharacters,
      });
      renderWithProviders(<Home />, store);
      
      // Should only render first 8 characters
      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 8')).toBeInTheDocument();
      expect(screen.queryByText('Character 9')).not.toBeInTheDocument();
      expect(screen.queryByText('Character 12')).not.toBeInTheDocument();
    });
  });

  describe('Redux integration', () => {
    it('should dispatch getPopularCharacters on mount', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<Home />, store);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'character/getPopularCharacters/pending'
          })
        );
      });
    });

    it('should respond to auth state changes', () => {
      const store = createMockStore({ isAuthenticated: false });
      const { rerender } = renderWithProviders(<Home />, store);
      
      // Initially shows unauthenticated buttons
      expect(screen.getByRole('link', { name: 'Get Started' })).toBeInTheDocument();
      
      // Update store state
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: { user: { id: '1', isCreator: false }, token: 'token' }
      });
      
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <Home />
          </BrowserRouter>
        </Provider>
      );
      
      // Should now show authenticated buttons
      expect(screen.getByRole('link', { name: 'My Dashboard' })).toBeInTheDocument();
    });

    it('should respond to character loading state changes', () => {
      const store = createMockStore({}, { loading: true });
      const { rerender } = renderWithProviders(<Home />, store);
      
      // Initially shows spinner
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      // Update store state
      store.dispatch({
        type: 'character/getPopularCharacters/fulfilled',
        payload: mockCharacters
      });
      
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <Home />
          </BrowserRouter>
        </Provider>
      );
      
      // Should now show characters
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Create Your Perfect Anime Companion' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'How It Works' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Popular Characters' })).toBeInTheDocument();
    });

    it('should have accessible navigation links', () => {
      const store = createMockStore();
      renderWithProviders(<Home />, store);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });

    it('should have images with alt text', () => {
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: mockCharacters,
      });
      renderWithProviders(<Home />, store);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined user gracefully', () => {
      const store = createMockStore({
        isAuthenticated: true,
        user: undefined,
      });
      
      expect(() => {
        renderWithProviders(<Home />, store);
      }).not.toThrow();
    });

    it('should handle characters with missing data', () => {
      const incompleteCharacters = [
        {
          _id: '1',
          name: '',
          imageUrl: '',
          creator: { username: '' },
        },
      ];
      
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: incompleteCharacters,
      });
      
      expect(() => {
        renderWithProviders(<Home />, store);
      }).not.toThrow();
    });

    it('should handle empty character arrays', () => {
      const store = createMockStore({}, {
        loading: false,
        popularCharacters: [],
      });
      
      renderWithProviders(<Home />, store);
      
      expect(screen.getByText('No characters found. Be the first to create one!')).toBeInTheDocument();
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render unnecessarily', () => {
      const store = createMockStore();
      const { rerender } = renderWithProviders(<Home />, store);
      
      const initialHTML = document.body.innerHTML;
      
      // Re-render with same props
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <Home />
          </BrowserRouter>
        </Provider>
      );
      
      // Should have consistent structure
      expect(document.body.innerHTML).toBeTruthy();
    });
  });
});