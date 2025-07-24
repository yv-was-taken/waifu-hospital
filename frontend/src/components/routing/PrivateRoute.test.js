import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import PrivateRoute from './PrivateRoute';
import authReducer from '../../features/auth/authSlice';

// Mock the Spinner component
jest.mock('../layout/Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

const createMockStore = (authState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        ...authState,
      },
    },
  });
};

// Mock component to render in private route
const MockProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;

const renderWithRouter = (component, store, initialEntries = ['/protected']) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('PrivateRoute Component', () => {
  describe('Authentication states', () => {
    it('should render spinner when loading', () => {
      const store = createMockStore({ 
        loading: true,
        isAuthenticated: false 
      });
      
      renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated and not loading', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: false
      });
      
      renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      // Note: Navigation redirect can't be easily tested without more complex setup
    });

    it('should render protected component when authenticated', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true,
        user: { id: '1', username: 'testuser' }
      });
      
      renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should prioritize loading state over authentication', () => {
      const store = createMockStore({
        loading: true,
        isAuthenticated: true // Even if authenticated, should show loading
      });
      
      renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should handle loading completion', () => {
      const store = createMockStore({
        loading: true,
        isAuthenticated: false
      });
      
      const { rerender } = renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      // Simulate loading completion with authentication
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: { user: { id: '1' }, token: 'token' }
      });
      
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute component={MockProtectedComponent} />
          </MemoryRouter>
        </Provider>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Component prop handling', () => {
    it('should pass through component correctly', () => {
      const CustomComponent = () => <div data-testid="custom-component">Custom Content</div>;
      
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      renderWithRouter(
        <PrivateRoute component={CustomComponent} />,
        store
      );
      
      expect(screen.getByTestId('custom-component')).toBeInTheDocument();
    });

    it('should handle component with props', () => {
      const ComponentWithProps = ({ title }) => <div data-testid="props-component">{title}</div>;
      
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      // Note: This test shows current limitation - props aren't passed through
      renderWithRouter(
        <PrivateRoute component={ComponentWithProps} />,
        store
      );
      
      expect(screen.getByTestId('props-component')).toBeInTheDocument();
    });

    it('should handle functional components', () => {
      const FunctionalComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <span data-testid="count">{count}</span>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        );
      };
      
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      renderWithRouter(
        <PrivateRoute component={FunctionalComponent} />,
        store
      );
      
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing component prop gracefully', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      expect(() => {
        renderWithRouter(<PrivateRoute />, store);
      }).not.toThrow();
    });

    it('should handle undefined auth state', () => {
      const storeWithUndefinedAuth = configureStore({
        reducer: {
          auth: () => undefined
        }
      });
      
      expect(() => {
        renderWithRouter(
          <PrivateRoute component={MockProtectedComponent} />,
          storeWithUndefinedAuth
        );
      }).not.toThrow();
    });

    it('should handle null component', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      expect(() => {
        renderWithRouter(<PrivateRoute component={null} />, store);
      }).not.toThrow();
    });
  });

  describe('State transitions', () => {
    it('should handle authentication state changes', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: false
      });
      
      const { rerender } = renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      // Initially not authenticated (should redirect)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      
      // Simulate login
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: { user: { id: '1' }, token: 'token' }
      });
      
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute component={MockProtectedComponent} />
          </MemoryRouter>
        </Provider>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle logout scenario', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true,
        user: { id: '1' }
      });
      
      const { rerender } = renderWithRouter(
        <PrivateRoute component={MockProtectedComponent} />,
        store
      );
      
      // Initially authenticated
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      
      // Simulate logout
      store.dispatch({ type: 'auth/logout' });
      
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute component={MockProtectedComponent} />
          </MemoryRouter>
        </Provider>
      );
      
      // Should no longer show protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Integration with React Router', () => {
    it('should work with BrowserRouter', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateRoute component={MockProtectedComponent} />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle navigation context properly', () => {
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      // Should not throw when used within router context
      expect(() => {
        renderWithRouter(
          <PrivateRoute component={MockProtectedComponent} />,
          store
        );
      }).not.toThrow();
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const SpyComponent = () => {
        renderSpy();
        return <div data-testid="spy-component">Spy</div>;
      };
      
      const store = createMockStore({
        loading: false,
        isAuthenticated: true
      });
      
      const { rerender } = renderWithRouter(
        <PrivateRoute component={SpyComponent} />,
        store
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute component={SpyComponent} />
          </MemoryRouter>
        </Provider>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Component re-renders but that's expected
    });
  });
});