import { configureStore } from '@reduxjs/toolkit';
import merchandiseReducer, {
  getMerchandise,
  getCreatorMerchandise,
  getCharacterMerchandise,
  getMerchandiseById,
  createMerchandise,
  updateMerchandise,
  deleteMerchandise,
  clearProduct,
  clearError,
} from './merchandiseSlice';
import alertsReducer from '../alerts/alertSlice';
import axios from 'axios';

// Mock data
const mockMerchandise = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Test Merchandise',
  description: 'A test merchandise item',
  price: 19.99,
  imageUrl: 'https://example.com/merch.jpg',
  category: 't-shirt',
  stock: 100,
  sold: 0,
  isApproved: true,
  creator: '507f1f77bcf86cd799439011',
  character: '507f1f77bcf86cd799439012',
};

// Mock axios
jest.mock('axios');

describe('merchandiseSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        merchandise: merchandiseReducer,
        alerts: alertsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should handle initial state', () => {
      const initialState = merchandiseReducer(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        merchandise: [],
        creatorMerchandise: [],
        characterMerchandise: [],
        product: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle clearProduct', () => {
      const initialState = {
        merchandise: [],
        creatorMerchandise: [],
        characterMerchandise: [],
        product: mockMerchandise,
        loading: false,
        error: null,
      };

      const action = clearProduct();
      const state = merchandiseReducer(initialState, action);

      expect(state.product).toBeNull();
    });

    it('should handle clearError', () => {
      const initialState = {
        merchandise: [],
        creatorMerchandise: [],
        characterMerchandise: [],
        product: null,
        loading: false,
        error: 'Some error',
      };

      const action = clearError();
      const state = merchandiseReducer(initialState, action);

      expect(state.error).toBeNull();
    });
  });

  describe('getMerchandise async thunk', () => {
    it('should handle getMerchandise.pending', () => {
      const action = { type: getMerchandise.pending.type };
      const state = merchandiseReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle getMerchandise.fulfilled', async () => {
      const merchandiseData = [mockMerchandise];
      axios.get.mockResolvedValue({ data: merchandiseData });

      await store.dispatch(getMerchandise());
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.merchandise).toEqual(merchandiseData);
    });

    it('should handle getMerchandise.rejected', async () => {
      const errorMsg = 'Failed to fetch merchandise';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getMerchandise());
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });

    it('should handle getMerchandise.rejected without response data', async () => {
      axios.get.mockRejectedValue({
        response: { data: {} }
      });

      await store.dispatch(getMerchandise());
      const state = store.getState().merchandise;

      expect(state.error).toBe('Failed to fetch merchandise');
    });
  });

  describe('getCreatorMerchandise async thunk', () => {
    it('should handle getCreatorMerchandise.fulfilled', async () => {
      const creatorMerchandiseData = [mockMerchandise];
      axios.get.mockResolvedValue({ data: creatorMerchandiseData });

      await store.dispatch(getCreatorMerchandise());
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.creatorMerchandise).toEqual(creatorMerchandiseData);
    });

    it('should handle getCreatorMerchandise.rejected', async () => {
      const errorMsg = 'Failed to fetch your merchandise';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getCreatorMerchandise());
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('getCharacterMerchandise async thunk', () => {
    it('should handle getCharacterMerchandise.fulfilled', async () => {
      const characterMerchandiseData = [mockMerchandise];
      axios.get.mockResolvedValue({ data: characterMerchandiseData });

      await store.dispatch(getCharacterMerchandise('character123'));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.characterMerchandise).toEqual(characterMerchandiseData);
      expect(axios.get).toHaveBeenCalledWith('/api/merchandise/character/character123');
    });

    it('should handle getCharacterMerchandise.rejected', async () => {
      const errorMsg = 'Character not found';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getCharacterMerchandise('invalid-character'));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('getMerchandiseById async thunk', () => {
    it('should handle getMerchandiseById.fulfilled', async () => {
      axios.get.mockResolvedValue({ data: mockMerchandise });

      await store.dispatch(getMerchandiseById(mockMerchandise._id));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.product).toEqual(mockMerchandise);
      expect(axios.get).toHaveBeenCalledWith(`/api/merchandise/${mockMerchandise._id}`);
    });

    it('should handle getMerchandiseById.rejected', async () => {
      const errorMsg = 'Merchandise not found';
      axios.get.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(getMerchandiseById('invalid-id'));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('createMerchandise async thunk', () => {
    const merchandiseData = {
      name: 'New Merchandise',
      description: 'A new merchandise item',
      price: 29.99,
      category: 'hoodie',
    };

    it('should handle createMerchandise.pending', () => {
      const action = { type: createMerchandise.pending.type };
      const state = merchandiseReducer(undefined, action);
      
      expect(state.loading).toBe(true);
    });

    it('should handle createMerchandise.fulfilled', async () => {
      const newMerchandise = { ...mockMerchandise, ...merchandiseData };
      axios.post.mockResolvedValue({ data: newMerchandise });

      await store.dispatch(createMerchandise(merchandiseData));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.creatorMerchandise).toContain(newMerchandise);
      expect(state.merchandise).toContain(newMerchandise);
      expect(state.creatorMerchandise[0]).toEqual(newMerchandise); // Should be at the beginning
      expect(state.merchandise[0]).toEqual(newMerchandise); // Should be at the beginning

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Merchandise created successfully!');
      expect(alertState[0].type).toBe('success');
    });

    it('should handle createMerchandise.rejected', async () => {
      const errorMsg = 'Merchandise creation failed';
      axios.post.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(createMerchandise(merchandiseData));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle createMerchandise.rejected without response data', async () => {
      axios.post.mockRejectedValue({
        response: { data: {} }
      });

      await store.dispatch(createMerchandise(merchandiseData));
      const state = store.getState().merchandise;

      expect(state.error).toBe('Merchandise creation failed');

      // Check default error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Failed to create merchandise');
      expect(alertState[0].type).toBe('error');
    });
  });

  describe('updateMerchandise async thunk', () => {
    const updateData = {
      id: mockMerchandise._id,
      formData: {
        name: 'Updated Merchandise',
        description: 'Updated description',
        price: 24.99,
      },
    };

    it('should handle updateMerchandise.fulfilled', async () => {
      const updatedMerchandise = { ...mockMerchandise, ...updateData.formData };
      axios.put.mockResolvedValue({ data: updatedMerchandise });

      // Set initial state with existing merchandise in all arrays
      const initialState = {
        merchandise: [mockMerchandise],
        creatorMerchandise: [mockMerchandise],
        characterMerchandise: [mockMerchandise],
        product: mockMerchandise,
        loading: false,
        error: null,
      };

      let state = merchandiseReducer(initialState, { type: 'test' });
      state = merchandiseReducer(state, {
        type: updateMerchandise.fulfilled.type,
        payload: updatedMerchandise,
      });

      expect(state.loading).toBe(false);
      expect(state.product).toEqual(updatedMerchandise);
      expect(state.merchandise[0]).toEqual(updatedMerchandise);
      expect(state.creatorMerchandise[0]).toEqual(updatedMerchandise);
      expect(state.characterMerchandise[0]).toEqual(updatedMerchandise);
    });

    it('should handle updateMerchandise.rejected', async () => {
      const errorMsg = 'Update failed';
      axios.put.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(updateMerchandise(updateData));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle updateMerchandise with store dispatch', async () => {
      const updatedMerchandise = { ...mockMerchandise, name: 'Updated Name' };
      axios.put.mockResolvedValue({ data: updatedMerchandise });

      await store.dispatch(updateMerchandise(updateData));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.product).toEqual(updatedMerchandise);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Merchandise updated successfully!');
      expect(alertState[0].type).toBe('success');
    });
  });

  describe('deleteMerchandise async thunk', () => {
    it('should handle deleteMerchandise.fulfilled', async () => {
      axios.delete.mockResolvedValue({});

      // Set initial state with existing merchandise in all arrays
      const initialState = {
        merchandise: [mockMerchandise],
        creatorMerchandise: [mockMerchandise],
        characterMerchandise: [mockMerchandise],  
        product: mockMerchandise,
        loading: false,
        error: null,
      };

      let state = merchandiseReducer(initialState, { type: 'test' });
      state = merchandiseReducer(state, {
        type: deleteMerchandise.fulfilled.type,
        payload: mockMerchandise._id,
      });

      expect(state.loading).toBe(false);
      expect(state.merchandise).toHaveLength(0);
      expect(state.creatorMerchandise).toHaveLength(0);
      expect(state.characterMerchandise).toHaveLength(0);
      expect(state.product).toBeNull(); // Should clear product if it's the deleted item
    });

    it('should handle deleteMerchandise.fulfilled without clearing unrelated product', async () => {
      const anotherMerchandise = { ...mockMerchandise, _id: 'another-id' };
      
      const initialState = {
        merchandise: [mockMerchandise],
        creatorMerchandise: [mockMerchandise],
        characterMerchandise: [mockMerchandise],
        product: anotherMerchandise, // Different product
        loading: false,
        error: null,
      };

      let state = merchandiseReducer(initialState, { type: 'test' });
      state = merchandiseReducer(state, {
        type: deleteMerchandise.fulfilled.type,
        payload: mockMerchandise._id,
      });

      expect(state.product).toEqual(anotherMerchandise); // Should not clear unrelated product
    });

    it('should handle deleteMerchandise.rejected', async () => {
      const errorMsg = 'Delete failed';
      axios.delete.mockRejectedValue({
        response: { data: { msg: errorMsg } }
      });

      await store.dispatch(deleteMerchandise(mockMerchandise._id));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);

      // Check error alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe(errorMsg);
      expect(alertState[0].type).toBe('error');
    });

    it('should handle deleteMerchandise with store dispatch', async () => {
      axios.delete.mockResolvedValue({});

      await store.dispatch(deleteMerchandise(mockMerchandise._id));
      const state = store.getState().merchandise;

      expect(state.loading).toBe(false);
      expect(axios.delete).toHaveBeenCalledWith(`/api/merchandise/${mockMerchandise._id}`);

      // Check success alert was dispatched
      const alertState = store.getState().alerts;
      expect(alertState).toHaveLength(1);
      expect(alertState[0].msg).toBe('Merchandise deleted successfully!');
      expect(alertState[0].type).toBe('success');
    });
  });

  describe('edge cases', () => {
    it('should handle updateMerchandise when item not found in arrays', () => {
      const updatedMerchandise = { _id: 'non-existent', name: 'Updated' };
      const otherMerchandise = { _id: 'other', name: 'Other Item' };
      
      const initialState = {
        merchandise: [otherMerchandise],
        creatorMerchandise: [otherMerchandise],
        characterMerchandise: [otherMerchandise],
        product: null,
        loading: false,
        error: null,
      };

      const state = merchandiseReducer(initialState, {
        type: updateMerchandise.fulfilled.type,
        payload: updatedMerchandise,
      });

      // Arrays should remain unchanged when item not found
      expect(state.merchandise[0]).toEqual(otherMerchandise);
      expect(state.creatorMerchandise[0]).toEqual(otherMerchandise);
      expect(state.characterMerchandise[0]).toEqual(otherMerchandise);
      // But product should still be updated
      expect(state.product).toEqual(updatedMerchandise);
    });

    it('should handle deleteMerchandise when item not found in arrays', () => {
      const otherMerchandise = { _id: 'other', name: 'Other Item' };
      
      const initialState = {
        merchandise: [otherMerchandise],
        creatorMerchandise: [otherMerchandise],
        characterMerchandise: [otherMerchandise],
        product: null,
        loading: false,
        error: null,
      };

      const state = merchandiseReducer(initialState, {
        type: deleteMerchandise.fulfilled.type,
        payload: 'non-existent-id',
      });

      // Arrays should remain unchanged when item not found
      expect(state.merchandise).toHaveLength(1);
      expect(state.creatorMerchandise).toHaveLength(1);
      expect(state.characterMerchandise).toHaveLength(1);
    });

    it('should handle multiple items in arrays during update', () => {
      const merchandise1 = { _id: 'id1', name: 'Item 1' };
      const merchandise2 = { _id: 'id2', name: 'Item 2' };
      const updatedMerchandise2 = { _id: 'id2', name: 'Updated Item 2' };
      
      const initialState = {
        merchandise: [merchandise1, merchandise2],
        creatorMerchandise: [merchandise1, merchandise2],
        characterMerchandise: [merchandise1, merchandise2],
        product: null,
        loading: false,
        error: null,
      };

      const state = merchandiseReducer(initialState, {
        type: updateMerchandise.fulfilled.type,
        payload: updatedMerchandise2,
      });

      expect(state.merchandise[0]).toEqual(merchandise1); // Unchanged
      expect(state.merchandise[1]).toEqual(updatedMerchandise2); // Updated
      expect(state.creatorMerchandise[0]).toEqual(merchandise1); // Unchanged
      expect(state.creatorMerchandise[1]).toEqual(updatedMerchandise2); // Updated
    });

    it('should handle async thunk console errors', async () => {
      // This test is mainly for coverage of console.error calls that might exist
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      axios.get.mockRejectedValue(new Error('Test error'));

      await store.dispatch(getMerchandise());
      
      // If there are console.error calls in the thunks, they would be caught here
      // For now, we just ensure the test doesn't fail
      
      consoleSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should set loading to true for all pending actions', () => {
      const actions = [
        getMerchandise.pending.type,
        getCreatorMerchandise.pending.type,
        getCharacterMerchandise.pending.type,
        getMerchandiseById.pending.type,
        createMerchandise.pending.type,
        updateMerchandise.pending.type,
        deleteMerchandise.pending.type,
      ];

      actions.forEach(actionType => {
        const state = merchandiseReducer(undefined, { type: actionType });
        expect(state.loading).toBe(true);
      });
    });

    it('should set loading to false for fulfilled/rejected actions', () => {
      const actions = [
        { type: getMerchandise.fulfilled.type, payload: [] },
        { type: getCreatorMerchandise.fulfilled.type, payload: [] },
        { type: getCharacterMerchandise.fulfilled.type, payload: [] },
        { type: getMerchandiseById.fulfilled.type, payload: mockMerchandise },
        { type: createMerchandise.fulfilled.type, payload: mockMerchandise },
        { type: updateMerchandise.fulfilled.type, payload: mockMerchandise },
        { type: deleteMerchandise.fulfilled.type, payload: mockMerchandise._id },
        { type: getMerchandise.rejected.type, payload: 'error' },
        { type: getCreatorMerchandise.rejected.type, payload: 'error' },
      ];

      actions.forEach(action => {
        const initialState = {
          merchandise: [],
          creatorMerchandise: [],
          characterMerchandise: [],
          product: null,
          loading: true,
          error: null,
        };
        const state = merchandiseReducer(initialState, action);
        expect(state.loading).toBe(false);
      });
    });
  });

  describe('API endpoint calls', () => {
    it('should call correct endpoints for each thunk', async () => {
      // Test all the endpoint calls
      axios.get.mockResolvedValue({ data: [] });
      axios.post.mockResolvedValue({ data: mockMerchandise });
      axios.put.mockResolvedValue({ data: mockMerchandise });
      axios.delete.mockResolvedValue({});

      await store.dispatch(getMerchandise());
      expect(axios.get).toHaveBeenCalledWith('/api/merchandise');

      await store.dispatch(getCreatorMerchandise());
      expect(axios.get).toHaveBeenCalledWith('/api/merchandise/creator');

      await store.dispatch(getCharacterMerchandise('char123'));
      expect(axios.get).toHaveBeenCalledWith('/api/merchandise/character/char123');

      await store.dispatch(getMerchandiseById('merch123'));
      expect(axios.get).toHaveBeenCalledWith('/api/merchandise/merch123');

      const formData = { name: 'Test', price: 19.99 };
      await store.dispatch(createMerchandise(formData));
      expect(axios.post).toHaveBeenCalledWith('/api/merchandise', formData);

      await store.dispatch(updateMerchandise({ 
        id: 'merch123', 
        formData: { name: 'Updated' } 
      }));
      expect(axios.put).toHaveBeenCalledWith('/api/merchandise/merch123', { name: 'Updated' });

      await store.dispatch(deleteMerchandise('merch123'));
      expect(axios.delete).toHaveBeenCalledWith('/api/merchandise/merch123');
    });
  });
});