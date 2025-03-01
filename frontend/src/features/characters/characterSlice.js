import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setAlert } from '../alerts/alertSlice';

// Get all characters
export const getCharacters = createAsyncThunk(
  'character/getCharacters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/characters');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to fetch characters');
    }
  }
);

// Get user characters
export const getUserCharacters = createAsyncThunk(
  'character/getUserCharacters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/characters/user');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to fetch your characters');
    }
  }
);

// Get popular characters
export const getPopularCharacters = createAsyncThunk(
  'character/getPopularCharacters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/characters/popular');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to fetch popular characters');
    }
  }
);

// Get character by ID
export const getCharacterById = createAsyncThunk(
  'character/getCharacterById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/characters/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to fetch character');
    }
  }
);

// Create new character
export const createCharacter = createAsyncThunk(
  'character/createCharacter',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post('/api/characters', formData);
      
      dispatch(setAlert({
        msg: 'Character created successfully!',
        type: 'success'
      }));
      
      return res.data;
    } catch (err) {
      dispatch(setAlert({
        msg: err.response.data.msg || 'Failed to create character',
        type: 'error'
      }));
      
      return rejectWithValue(err.response.data.msg || 'Character creation failed');
    }
  }
);

// Update character
export const updateCharacter = createAsyncThunk(
  'character/updateCharacter',
  async ({ id, formData }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/characters/${id}`, formData);
      
      dispatch(setAlert({
        msg: 'Character updated successfully!',
        type: 'success'
      }));
      
      return res.data;
    } catch (err) {
      dispatch(setAlert({
        msg: err.response.data.msg || 'Failed to update character',
        type: 'error'
      }));
      
      return rejectWithValue(err.response.data.msg || 'Character update failed');
    }
  }
);

// Delete character
export const deleteCharacter = createAsyncThunk(
  'character/deleteCharacter',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`/api/characters/${id}`);
      
      dispatch(setAlert({
        msg: 'Character deleted successfully!',
        type: 'success'
      }));
      
      return id;
    } catch (err) {
      dispatch(setAlert({
        msg: err.response.data.msg || 'Failed to delete character',
        type: 'error'
      }));
      
      return rejectWithValue(err.response.data.msg || 'Character deletion failed');
    }
  }
);

// Like character
export const likeCharacter = createAsyncThunk(
  'character/likeCharacter',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/api/characters/${id}/like`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to like character');
    }
  }
);

// Unlike character
export const unlikeCharacter = createAsyncThunk(
  'character/unlikeCharacter',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/api/characters/${id}/unlike`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg || 'Failed to unlike character');
    }
  }
);

// Initial state
const initialState = {
  characters: [],
  userCharacters: [],
  popularCharacters: [],
  character: null,
  loading: false,
  error: null
};

// Slice
const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    clearCharacter: (state) => {
      state.character = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all characters
      .addCase(getCharacters.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.characters = action.payload;
      })
      .addCase(getCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get user characters
      .addCase(getUserCharacters.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.userCharacters = action.payload;
      })
      .addCase(getUserCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get popular characters
      .addCase(getPopularCharacters.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPopularCharacters.fulfilled, (state, action) => {
        state.loading = false;
        state.popularCharacters = action.payload;
      })
      .addCase(getPopularCharacters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get character by ID
      .addCase(getCharacterById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCharacterById.fulfilled, (state, action) => {
        state.loading = false;
        state.character = action.payload;
      })
      .addCase(getCharacterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create new character
      .addCase(createCharacter.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.userCharacters.unshift(action.payload);
      })
      .addCase(createCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update character
      .addCase(updateCharacter.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.character = action.payload;
        state.userCharacters = state.userCharacters.map(character => 
          character._id === action.payload._id ? action.payload : character
        );
      })
      .addCase(updateCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete character
      .addCase(deleteCharacter.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCharacter.fulfilled, (state, action) => {
        state.loading = false;
        state.userCharacters = state.userCharacters.filter(
          character => character._id !== action.payload
        );
        state.character = null;
      })
      .addCase(deleteCharacter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Like character
      .addCase(likeCharacter.fulfilled, (state, action) => {
        if (state.character) {
          state.character = action.payload;
        }
        state.characters = state.characters.map(character => 
          character._id === action.payload._id ? action.payload : character
        );
        state.popularCharacters = state.popularCharacters.map(character => 
          character._id === action.payload._id ? action.payload : character
        );
      })
      
      // Unlike character
      .addCase(unlikeCharacter.fulfilled, (state, action) => {
        if (state.character) {
          state.character = action.payload;
        }
        state.characters = state.characters.map(character => 
          character._id === action.payload._id ? action.payload : character
        );
        state.popularCharacters = state.popularCharacters.map(character => 
          character._id === action.payload._id ? action.payload : character
        );
      });
  }
});

export const { clearCharacter, clearError } = characterSlice.actions;

export default characterSlice.reducer;