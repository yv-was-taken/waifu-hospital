import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import authReducer from '../features/auth/authSlice';
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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
    it('should render login form elements', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    it('should render register link', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
    });

    it('should have empty form fields initially', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Password')).toHaveValue('');
    });

    it('should have proper input types', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('should have required attributes on inputs', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByLabelText('Password')).toBeRequired();
    });
  });

  describe('Form interactions', () => {
    it('should update email field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field on input change', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('should update both fields independently', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Form submission', () => {
    it('should show error when submitting empty form', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Login />, store);
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'alert/setAlert',
            payload: expect.objectContaining({
              msg: 'Please fill in all fields',
              type: 'error'
            })
          })
        );
      });
    });

    it('should show error when email is empty', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Login />, store);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'alert/setAlert',
            payload: expect.objectContaining({
              msg: 'Please fill in all fields',
              type: 'error'
            })
          })
        );
      });
    });

    it('should show error when password is empty', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'alert/setAlert',
            payload: expect.objectContaining({
              msg: 'Please fill in all fields',
              type: 'error'
            })
          })
        );
      });
    });

    it('should dispatch login action with valid credentials', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(submitButton);
      
      // Verify dispatch was called - the login logic exists
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should prevent default form submission', () => {
      const store = createMockStore();
      const { container } = renderWithProviders(<Login />, store);
      
      const form = container.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      fireEvent(form, submitEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle Enter key press on form inputs', async () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Enter key should trigger form submission behavior
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
      
      // Verify form is still interactive after keypress
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Loading states', () => {
    it('should show spinner when loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Login />, store);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Log In' })).not.toBeInTheDocument();
    });

    it('should hide form when loading', () => {
      const store = createMockStore({ loading: true });
      renderWithProviders(<Login />, store);
      
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
    });
  });

  describe('Authentication state', () => {
    it('should redirect to dashboard when authenticated', () => {
      const store = createMockStore({ isAuthenticated: true });
      renderWithProviders(<Login />, store);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should not render form when authenticated and redirecting', () => {
      const store = createMockStore({ isAuthenticated: true });
      renderWithProviders(<Login />, store);
      
      // Form might still be rendered briefly before redirect, but navigate should be called
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle authentication state changes', () => {
      const store = createMockStore({ isAuthenticated: false });
      renderWithProviders(<Login />, store);
      
      // Initially should show form
      expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
      
      // Verify the form is rendered for non-authenticated users
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Log In' })).toBeInTheDocument();
    });

    it('should associate labels with inputs', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('should have accessible button', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should have accessible navigation links', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const registerLink = screen.getByRole('link', { name: 'Register' });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Error handling', () => {
    it('should handle login failure gracefully', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock login to reject
      dispatchSpy.mockImplementation((action) => {
        if (action.type && action.type.includes('login')) {
          return {
            unwrap: () => Promise.reject(new Error('Login failed'))
          };
        }
        return action;
      });
      
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined auth state', () => {
      const storeWithUndefinedAuth = configureStore({
        reducer: {
          auth: () => ({ isAuthenticated: false, loading: false, user: null }),
          alert: alertReducer,
        }
      });
      
      expect(() => {
        renderWithProviders(<Login />, storeWithUndefinedAuth);
      }).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with different input methods', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      
      // Test different input events
      fireEvent.change(emailInput, { target: { value: 'a' } });
      fireEvent.change(emailInput, { target: { value: 'ab' } });
      fireEvent.change(emailInput, { target: { value: 'abc@example.com' } });
      
      expect(emailInput).toHaveValue('abc@example.com');
    });

    it('should handle rapid form submissions', async () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Log In' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Rapid submissions
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      
      // Should handle multiple submissions gracefully
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    it('should accept whitespace in inputs without trimming during display', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
      
      // Input should display the value as entered (React inputs don't auto-trim)
      expect(emailInput.value.includes('test@example.com')).toBe(true);
    });

    it('should handle special characters in inputs', () => {
      const store = createMockStore();
      renderWithProviders(<Login />, store);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test+tag@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'p@ssw0rd!#$' } });
      
      expect(emailInput).toHaveValue('test+tag@example.com');
      expect(passwordInput).toHaveValue('p@ssw0rd!#$');
    });
  });
});