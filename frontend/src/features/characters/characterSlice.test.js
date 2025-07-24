import { configureStore } from '@reduxjs/toolkit';
import characterReducer, {
  getCharacters,
  getUserCharacters,
  getPopularCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  likeCharacter,
  unlikeCharacter,
  clearCharacter,
  clearError,
} from './characterSlice';
import alertsReducer from '../alerts/alertSlice';
import api from '../../utils/api';
// Mock character data
const mockCharacter = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Character',
  description: 'A test character for testing purposes',
  personality: 'Friendly and helpful',
  imageUrl: 'https://example.com/character.jpg',
  public: true,
  creator: {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
  },
  likes: 5,
  createdAt: '2023-01-01T00:00:00.000Z',
};

// Mock the API
jest.mock('../../utils/api');

describe('characterSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        characters: characterReducer,
        alerts: alertsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should handle initial state', () => {
      const initialState = characterReducer(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        characters: [],
        userCharacters: [],
        popularCharacters: [],
        character: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle clearCharacter', () => {
      const initialState = {
        characters: [],
        userCharacters: [],
        popularCharacters: [],
        character: mockCharacter,
        loading: false,
        error: null,
      };

      const action = clearCharacter();
      const state = characterReducer(initialState, action);

      expect(state.character).toBeNull();
    });

    it('should handle clearError', () => {
      const initialState = {
        characters: [],
        userCharacters: [],
        popularCharacters: [],
        character: null,
        loading: false,
        error: 'Some error',
      };

      const action = clearError();
      const state = characterReducer(initialState, action);

      expect(state.error).toBeNull();
    });
  });

  describe('getCharacters async thunk', () => {
    it('should handle getCharacters.pending', () => {
      const action = { type: getCharacters.pending.type };
      const state = characterReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle getCharacters.fulfilled', async () => {
      const charactersData = [mockCharacter];
      api.get.mockResolvedValue({ data: charactersData });

      await store.dispatch(getCharacters());
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.characters).toEqual(charactersData);
    });

    it('should handle getCharacters.rejected', async () => {
      const errorMsg = 'Failed to fetch characters';
      api.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getCharacters());
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });

    it('should handle getCharacters.rejected without response data', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await store.dispatch(getCharacters());
      const state = store.getState().characters;

      expect(state.error).toBe('Failed to fetch characters');
    });
  });

  describe('getUserCharacters async thunk', () => {
    it('should handle getUserCharacters.fulfilled', async () => {
      const userCharactersData = [mockCharacter];
      api.get.mockResolvedValue({ data: userCharactersData });

      await store.dispatch(getUserCharacters());
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.userCharacters).toEqual(userCharactersData);
    });

    it('should handle getUserCharacters.rejected', async () => {
      const errorMsg = 'Failed to fetch your characters';
      api.get.mockRejectedValue({
        response: { data: { msg: 'Custom error' } }
      });

      await store.dispatch(getUserCharacters());
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Custom error');
    });
  });

  describe('getPopularCharacters async thunk', () => {
    it('should handle getPopularCharacters.fulfilled', async () => {
      const popularCharactersData = [{ ...mockCharacter, likes: 100 }];
      api.get.mockResolvedValue({ data: popularCharactersData });

      await store.dispatch(getPopularCharacters());
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.popularCharacters).toEqual(popularCharactersData);
    });

    it('should handle getPopularCharacters.rejected', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await store.dispatch(getPopularCharacters());
      const state = store.getState().characters;

      expect(state.error).toBe('Failed to fetch popular characters');
    });
  });

  describe('getCharacterById async thunk', () => {
    it('should handle getCharacterById.fulfilled', async () => {
      api.get.mockResolvedValue({ data: mockCharacter });

      await store.dispatch(getCharacterById(mockCharacter._id));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.character).toEqual(mockCharacter);
    });

    it('should handle getCharacterById.rejected', async () => {
      const errorMsg = 'Character not found';
      api.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getCharacterById('invalid-id'));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('createCharacter async thunk', () => {
    const characterData = {
      name: 'New Character',
      description: 'A new character',
      personality: 'Friendly',
    };

    it('should handle createCharacter.fulfilled', async () => {
      const newCharacter = { ...mockCharacter, ...characterData };
      api.post.mockResolvedValue({ data: newCharacter });

      await store.dispatch(createCharacter(characterData));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.userCharacters).toContain(newCharacter);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Character created successfully!');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle createCharacter.rejected', async () => {
      const errorMsg = 'Character creation failed';
      api.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(createCharacter(characterData));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle createCharacter.rejected without response data', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await store.dispatch(createCharacter(characterData));
      const state = store.getState().characters;

      expect(state.error).toBe('Character creation failed');

      // Check default error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Failed to create character');
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('updateCharacter async thunk', () => {
    const updateData = {
      id: mockCharacter._id,
      formData: {
        name: 'Updated Character',
        description: 'Updated description',
      },
    };

    it('should handle updateCharacter.fulfilled', async () => {
      const updatedCharacter = { ...mockCharacter, ...updateData.formData };
      api.put.mockResolvedValue({ data: updatedCharacter });

      // Create store with initial state containing the character
      const storeWithData = configureStore({
        reducer: {
          characters: characterReducer,
          alerts: alertsReducer,
        },
        preloadedState: {
          characters: {
            characters: [],
            userCharacters: [mockCharacter],
            popularCharacters: [],
            character: mockCharacter,
            loading: false,
            error: null,
          },
          alerts: []
        }
      });

      await storeWithData.dispatch(updateCharacter(updateData));
      const state = storeWithData.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.character).toEqual(updatedCharacter);
      expect(state.userCharacters[0]).toEqual(updatedCharacter);

      // Check success alert was dispatched
      const alertState = storeWithData.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Character updated successfully!');
    });

    it('should handle updateCharacter.rejected', async () => {
      const errorMsg = 'Update failed';
      api.put.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(updateCharacter(updateData));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('deleteCharacter async thunk', () => {
    it('should handle deleteCharacter.fulfilled', async () => {
      api.delete.mockResolvedValue({});

      // Set initial state with existing character
      const initialState = {
        userCharacters: [mockCharacter],
        character: mockCharacter,
        characters: [],
        popularCharacters: [],
        loading: false,
        error: null,
      };

      let state = characterReducer(initialState, { type: 'test' });
      state = characterReducer(state, {
        type: deleteCharacter.fulfilled.type,
        payload: mockCharacter._id,
      });

      expect(state.loading).toBe(false);
      expect(state.userCharacters).toHaveLength(0);
      expect(state.character).toBeNull();
    });

    it('should handle deleteCharacter.rejected', async () => {
      const errorMsg = 'Delete failed';
      api.delete.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(deleteCharacter(mockCharacter._id));
      const state = store.getState().characters;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('likeCharacter async thunk', () => {
    it('should handle likeCharacter.fulfilled', async () => {
      const likedCharacter = { ...mockCharacter, likes: mockCharacter.likes + 1 };
      api.post.mockResolvedValue({ data: likedCharacter });

      // Set initial state
      const initialState = {
        characters: [mockCharacter],
        popularCharacters: [mockCharacter],
        userCharacters: [],
        character: mockCharacter,
        loading: false,
        error: null,
      };

      let state = characterReducer(initialState, { type: 'test' });
      state = characterReducer(state, {
        type: likeCharacter.fulfilled.type,
        payload: likedCharacter,
      });

      expect(state.character).toEqual(likedCharacter);
      expect(state.characters[0]).toEqual(likedCharacter);
      expect(state.popularCharacters[0]).toEqual(likedCharacter);
    });

    it('should handle likeCharacter.rejected', async () => {
      const errorMsg = 'Failed to like character';
      api.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      const result = await store.dispatch(likeCharacter(mockCharacter._id));
      
      expect(result.type).toBe(likeCharacter.rejected.type);
      expect(result.payload).toBe(errorMsg);
    });

    it('should handle likeCharacter.fulfilled without current character', async () => {
      const likedCharacter = { ...mockCharacter, likes: mockCharacter.likes + 1 };
      
      const initialState = {
        characters: [mockCharacter],
        popularCharacters: [mockCharacter],
        userCharacters: [],
        character: null, // No current character
        loading: false,
        error: null,
      };

      let state = characterReducer(initialState, { type: 'test' });
      state = characterReducer(state, {
        type: likeCharacter.fulfilled.type,
        payload: likedCharacter,
      });

      expect(state.character).toBeNull();
      expect(state.characters[0]).toEqual(likedCharacter);
      expect(state.popularCharacters[0]).toEqual(likedCharacter);
    });
  });

  describe('unlikeCharacter async thunk', () => {
    it('should handle unlikeCharacter.fulfilled', async () => {
      const unlikedCharacter = { ...mockCharacter, likes: Math.max(0, mockCharacter.likes - 1) };
      api.post.mockResolvedValue({ data: unlikedCharacter });

      // Set initial state
      const initialState = {
        characters: [mockCharacter],
        popularCharacters: [mockCharacter],
        userCharacters: [],
        character: mockCharacter,
        loading: false,
        error: null,
      };

      let state = characterReducer(initialState, { type: 'test' });
      state = characterReducer(state, {
        type: unlikeCharacter.fulfilled.type,
        payload: unlikedCharacter,
      });

      expect(state.character).toEqual(unlikedCharacter);
      expect(state.characters[0]).toEqual(unlikedCharacter);
      expect(state.popularCharacters[0]).toEqual(unlikedCharacter);
    });

    it('should handle unlikeCharacter.rejected', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await store.dispatch(unlikeCharacter(mockCharacter._id));
      
      expect(result.type).toBe(unlikeCharacter.rejected.type);
      expect(result.payload).toBe('Failed to unlike character');
    });
  });

  describe('edge cases', () => {
    it('should handle console errors in async thunks', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.get.mockRejectedValue(new Error('Test error'));

      await store.dispatch(getCharacters());
      expect(consoleSpy).toHaveBeenCalledWith('Get characters error:', expect.any(Error));

      await store.dispatch(getUserCharacters());
      expect(consoleSpy).toHaveBeenCalledWith('Get user characters error:', expect.any(Error));

      await store.dispatch(getPopularCharacters());
      expect(consoleSpy).toHaveBeenCalledWith('Get popular characters error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle createCharacter with console error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      api.post.mockRejectedValue(new Error('Test error'));

      await store.dispatch(createCharacter({}));

      expect(consoleSpy).toHaveBeenCalledWith('Character creation error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle updateCharacter with existing userCharacters', () => {
      const existingCharacter = { ...mockCharacter, name: 'Old Name' };
      const updatedCharacter = { ...mockCharacter, name: 'New Name' };
      
      const initialState = {
        characters: [],
        userCharacters: [existingCharacter, { _id: 'other-id', name: 'Other Character' }],
        popularCharacters: [],
        character: existingCharacter,
        loading: false,
        error: null,
      };

      const state = characterReducer(initialState, {
        type: updateCharacter.fulfilled.type,
        payload: updatedCharacter,
      });

      expect(state.userCharacters).toHaveLength(2);
      expect(state.userCharacters[0]).toEqual(updatedCharacter);
      expect(state.userCharacters[1].name).toBe('Other Character');
    });

    it('should handle like/unlike when character not found in arrays', () => {
      const likedCharacter = { ...mockCharacter, likes: 10 };
      
      const initialState = {
        characters: [{ _id: 'other-id', name: 'Other' }],
        popularCharacters: [{ _id: 'another-id', name: 'Another' }],
        userCharacters: [],
        character: mockCharacter,
        loading: false,
        error: null,
      };

      const state = characterReducer(initialState, {
        type: likeCharacter.fulfilled.type,
        payload: likedCharacter,
      });

      // Character not found in arrays, so they remain unchanged
      expect(state.characters[0].name).toBe('Other');
      expect(state.popularCharacters[0].name).toBe('Another');
      // But current character is updated
      expect(state.character).toEqual(likedCharacter);
    });
  });

  describe('loading states', () => {
    it('should set loading to true for all pending actions', () => {
      const actions = [
        getCharacters.pending.type,
        getUserCharacters.pending.type,
        getPopularCharacters.pending.type,
        getCharacterById.pending.type,
        createCharacter.pending.type,
        updateCharacter.pending.type,
        deleteCharacter.pending.type,
      ];

      actions.forEach(actionType => {
        const state = characterReducer(undefined, { type: actionType });
        expect(state.loading).toBe(true);
      });
    });

    it('should set loading to false for fulfilled/rejected actions', () => {
      const actions = [
        { type: getCharacters.fulfilled.type, payload: [] },
        { type: getUserCharacters.fulfilled.type, payload: [] },
        { type: getPopularCharacters.fulfilled.type, payload: [] },
        { type: getCharacterById.fulfilled.type, payload: mockCharacter },
        { type: createCharacter.fulfilled.type, payload: mockCharacter },
        { type: updateCharacter.fulfilled.type, payload: mockCharacter },
        { type: deleteCharacter.fulfilled.type, payload: mockCharacter._id },
        { type: getCharacters.rejected.type, payload: 'error' },
        { type: getUserCharacters.rejected.type, payload: 'error' },
      ];

      actions.forEach(action => {
        const initialState = {
          characters: [],
          userCharacters: [],
          popularCharacters: [],
          character: null,
          loading: true,
          error: null,
        };
        const state = characterReducer(initialState, action);
        expect(state.loading).toBe(false);
      });
    });
  });
});