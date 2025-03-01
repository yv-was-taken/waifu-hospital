import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = [];

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlert: {
      reducer: (state, action) => {
        state.push(action.payload);
      },
      prepare: ({ msg, type, timeout = 5000 }) => {
        const id = uuidv4();
        return {
          payload: {
            id,
            msg,
            type,
            timeout
          }
        };
      }
    },
    removeAlert: (state, action) => {
      return state.filter(alert => alert.id !== action.payload);
    }
  }
});

export const { setAlert, removeAlert } = alertSlice.actions;

export default alertSlice.reducer;