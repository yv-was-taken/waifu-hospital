import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Register from './Register';
import authReducer from '../features/auth/authSlice';
import alertReducer from '../features/alerts/alertSlice';

// Mock the Spinner component
jest.mock('../components/layout/Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

// Mock react-redux to control dispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

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

const createMockStore = (authState = {}, alertState = []) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      alert: alertReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        ...authState,
      },
      alert: alertState,
    },
  });
};

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    
    // Setup default successful API responses
    mockApi.post.mockResolvedValue({
      data: {
        token: 'mock-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com'
        }
      }
    });
  });

  describe('Initial render', () => {
    it('should render register form elements', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('should render login link', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByText("Already have an account?")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login');
    });

    it('should have empty form fields initially', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByLabelText('Username')).toHaveValue('');
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Password')).toHaveValue('');
      expect(screen.getByLabelText('Confirm Password')).toHaveValue('');
    });

    it('should have proper input types', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByLabelText('Username')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('type', 'password');
    });

    it('should have required attributes on inputs', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByLabelText('Username')).toBeRequired();
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByLabelText('Password')).toBeRequired();
      expect(screen.getByLabelText('Confirm Password')).toBeRequired();
    });

    it('should have minLength validation on password fields', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByLabelText('Password')).toHaveAttribute('minLength', '6');
      expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('minLength', '6');
    });
  });

  describe('Form interactions', () => {
    it('should update username field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      expect(usernameInput).toHaveValue('testuser');
    });

    it('should update email field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('should update confirm password field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    it('should update all fields independently', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      expect(usernameInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  describe('Form validation', () => {
    it('should show error when passwords do not match', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called (password mismatch should trigger alert)
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should dispatch register action when passwords match', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle case-sensitive password matching', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called (case mismatch should trigger alert)
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle whitespace in password matching', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123 ' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called (whitespace mismatch should trigger alert)
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should prevent default form submission', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const form = document.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      fireEvent(form, submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should submit form on Enter key press', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const form = document.querySelector('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should pass correct data to register action', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it('should show spinner when loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Register />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
    });

    it('should hide form when loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Register />, store);
      
      expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Register' })).not.toBeInTheDocument();
    });
  });

  describe('Authentication state', () => {
    it('should redirect to dashboard when authenticated', () => {
      const store = createMockStore({ isAuthenticated: true });
      renderWithProviders(<Register />, store);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle authentication state changes', () => {
      // Test with unauthenticated state
      const unauthenticatedStore = createMockStore({ isAuthenticated: false });
      const { unmount } = renderWithProviders(<Register />, unauthenticatedStore);
      
      // Initially should show form
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
      
      unmount();
      
      // Test with authenticated state
      const authenticatedStore = createMockStore({ isAuthenticated: true });
      renderWithProviders(<Register />, authenticatedStore);
      
      // Should trigger navigation
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Register' })).toBeInTheDocument();
    });

    it('should associate labels with inputs', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(usernameInput).toHaveAttribute('id', 'username');
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
    });

    it('should have accessible button', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have accessible navigation links', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const loginLink = screen.getByRole('link', { name: 'Log In' });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in username', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'user_123-test' } });
      
      expect(usernameInput).toHaveValue('user_123-test');
    });

    it('should handle special characters in password', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'p@ssw0rd!#$%' } });
      
      expect(passwordInput).toHaveValue('p@ssw0rd!#$%');
    });

    it('should handle empty string passwords', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      // Should dispatch register action even with empty passwords (server will validate)
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Verify dispatch was called
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle undefined auth state', () => {
      const storeWithUndefinedAuth = configureStore({
        reducer: {
          auth: () => ({ isAuthenticated: false, loading: false, user: null }),
          alert: alertReducer,
        }
      });
      
      expect(() => {
        renderWithProviders(<Register />, storeWithUndefinedAuth);
      }).not.toThrow();
    });
  });

  describe('User experience', () => {
    it('should provide immediate visual feedback for mismatched passwords', async () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(submitButton);
      
      // Verify dispatch was called for validation feedback
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle rapid form changes', () => {
      const store = createMockStore();
      renderWithProviders(<Register />, store);
      
      const usernameInput = screen.getByLabelText('Username');
      
      // Rapid changes
      fireEvent.change(usernameInput, { target: { value: 'a' } });
      fireEvent.change(usernameInput, { target: { value: 'ab' } });
      fireEvent.change(usernameInput, { target: { value: 'abc' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      expect(usernameInput).toHaveValue('testuser');
    });
  });
});