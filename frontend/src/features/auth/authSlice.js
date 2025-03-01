import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAuthToken } from '../../utils/setAuthToken';
import { setAlert } from '../alerts/alertSlice';

// Load user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
      }
      
      const res = await axios.get('/api/users/profile');
      return res.data;
    } catch (err) {
      localStorage.removeItem('token');
      return rejectWithValue(err.response.data.msg || 'Failed to load user');
    }
  }
);

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post('/api/users/register', formData);
      
      dispatch(setAlert({
        msg: 'Registration successful! You are now logged in.',
        type: 'success'
      }));
      
      return res.data;
    } catch (err) {
      const errors = err.response.data.errors;
      
      if (errors) {
        errors.forEach(error => dispatch(setAlert({
          msg: error.msg,
          type: 'error'
        })));
      }
      
      return rejectWithValue(err.response.data.msg || 'Registration failed');
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post('/api/users/login', formData);
      
      dispatch(setAlert({
        msg: 'Login successful!',
        type: 'success'
      }));
      
      return res.data;
    } catch (err) {
      dispatch(setAlert({
        msg: err.response.data.msg || 'Invalid credentials',
        type: 'error'
      }));
      
      return rejectWithValue(err.response.data.msg || 'Login failed');
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put('/api/users/profile', formData);
      
      dispatch(setAlert({
        msg: 'Profile updated successfully!',
        type: 'success'
      }));
      
      return res.data;
    } catch (err) {
      dispatch(setAlert({
        msg: err.response.data.msg || 'Failed to update profile',
        type: 'error'
      }));
      
      return rejectWithValue(err.response.data.msg || 'Update failed');
    }
  }
);

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;