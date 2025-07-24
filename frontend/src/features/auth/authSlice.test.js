import { configureStore } from '@reduxjs/toolkit';
import authReducer, { 
  loadUser, 
  register, 
  login, 
  updateProfile, 
  logout, 
  clearError 
} from './authSlice';
import alertsReducer from '../alerts/alertSlice';
import api from '../../utils/api';

// Mock the API
jest.mock('../../utils/api');

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    // Reset localStorage mock
    window.localStorage.getItem.mockReturnValue(null);
    window.localStorage.setItem.mockClear();
    window.localStorage.removeItem.mockClear();
    
    store = configureStore({
      reducer: {
        auth: authReducer,
        alerts: alertsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should handle initial state', () => {
      const initialState = authReducer(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        token: null, // localStorage returns null by default from our mock
        isAuthenticated: null,
        loading: true,
        user: null,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle logout', () => {
      const initialState = {
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        user: { id: '1', username: 'testuser' },
        error: null,
      };

      const action = logout();
      const state = authReducer(initialState, action);

      expect(state).toEqual({
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
      });
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle clearError', () => {
      const initialState = {
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: 'Some error',
      };

      const action = clearError();
      const state = authReducer(initialState, action);

      expect(state.error).toBeNull();
    });
  });

  describe('loadUser async thunk', () => {
    it('should handle loadUser.pending', () => {
      const action = { type: loadUser.pending.type };
      const state = authReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle loadUser.fulfilled', async () => {
      const userData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };

      api.get.mockResolvedValue({ data: userData });

      await store.dispatch(loadUser());
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(userData);
    });

    it('should handle loadUser.rejected', async () => {
      const errorMsg = 'Failed to load user';
      api.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(loadUser());
      const state = store.getState().auth;

      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe(errorMsg);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle loadUser.rejected without response data', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await store.dispatch(loadUser());
      const state = store.getState().auth;

      expect(state.error).toBe('Failed to load user');
    });
  });

  describe('register async thunk', () => {
    const formData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should handle register.pending', () => {
      const action = { type: register.pending.type };
      const state = authReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle register.fulfilled', async () => {
      const responseData = {
        token: 'new-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      api.post.mockResolvedValue({ data: responseData });

      await store.dispatch(register(formData));
      const state = store.getState().auth;

      expect(state.token).toBe(responseData.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(responseData.user);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', responseData.token);

      // Check alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Registration successful! You are now logged in.');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle register.rejected with validation errors', async () => {
      const errors = [
        { msg: 'Password must be at least 6 characters' },
        { msg: 'Email is required' }
      ];

      api.post.mockRejectedValue({
        response: { 
          data: { 
            msg: 'Validation failed',
            errors 
          } 
        }
      });

      await store.dispatch(register(formData));
      const state = store.getState().auth;

      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Validation failed');

      // Check error alerts were dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(2);
      expect(alertState[0].type).toBe('error');
      expect(alertState[1].type).toBe('error');
    });

    it('should handle register.rejected with network error', async () => {
      api.post.mockRejectedValue(new Error('Network Error'));

      await store.dispatch(register(formData));
      const state = store.getState().auth;

      expect(state.error).toBe('Registration failed');

      // Check network error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Network Error');
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('login async thunk', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should handle login.pending', () => {
      const action = { type: login.pending.type };
      const state = authReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle login.fulfilled', async () => {
      const responseData = {
        token: 'login-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      api.post.mockResolvedValue({ data: responseData });

      await store.dispatch(login(loginData));
      const state = store.getState().auth;

      expect(state.token).toBe(responseData.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(responseData.user);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', responseData.token);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Login successful!');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle login.rejected', async () => {
      const errorMsg = 'Invalid credentials';
      api.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(login(loginData));
      const state = store.getState().auth;

      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle login.rejected without response data', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await store.dispatch(login(loginData));
      const state = store.getState().auth;

      expect(state.error).toBe('Login failed');

      // Check default error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Invalid credentials');
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('updateProfile async thunk', () => {
    const profileData = {
      username: 'updateduser',
      email: 'updated@example.com',
    };

    it('should handle updateProfile.pending', () => {
      const action = { type: updateProfile.pending.type };
      const state = authReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle updateProfile.fulfilled', async () => {
      const updatedUser = {
        id: '1',
        username: 'updateduser',
        email: 'updated@example.com',
      };

      api.put.mockResolvedValue({ data: updatedUser });

      await store.dispatch(updateProfile(profileData));
      const state = store.getState().auth;

      expect(state.loading).toBe(false);
      expect(state.user).toEqual(updatedUser);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Profile updated successfully!');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle updateProfile.rejected', async () => {
      const errorMsg = 'Update failed';
      api.put.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(updateProfile(profileData));
      const state = store.getState().auth;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle updateProfile.rejected without response data', async () => {
      api.put.mockRejectedValue(new Error('Network error'));

      await store.dispatch(updateProfile(profileData));
      const state = store.getState().auth;

      expect(state.error).toBe('Update failed');

      // Check default error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Failed to update profile');
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('edge cases', () => {
    it('should handle loadUser with console error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.get.mockRejectedValue(new Error('Test error'));

      await store.dispatch(loadUser());

      expect(consoleSpy).toHaveBeenCalledWith('Load user error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle register with console error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.post.mockRejectedValue(new Error('Test error'));

      await store.dispatch(register({}));

      expect(consoleSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle login with console error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.post.mockRejectedValue(new Error('Test error'));

      await store.dispatch(login({}));

      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle updateProfile with console error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.put.mockRejectedValue(new Error('Test error'));

      await store.dispatch(updateProfile({}));

      expect(consoleSpy).toHaveBeenCalledWith('Update profile error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});