import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setAlert } from "../alerts/alertSlice";

// Get all merchandise
export const getMerchandise = createAsyncThunk(
  "merchandise/getMerchandise",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/merchandise");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to fetch merchandise",
      );
    }
  },
);

// Get creator merchandise
export const getCreatorMerchandise = createAsyncThunk(
  "merchandise/getCreatorMerchandise",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/merchandise/creator");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to fetch your merchandise",
      );
    }
  },
);

// Get character merchandise
export const getCharacterMerchandise = createAsyncThunk(
  "merchandise/getCharacterMerchandise",
  async (characterId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/merchandise/character/${characterId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to fetch character merchandise",
      );
    }
  },
);

// Get merchandise by ID
export const getMerchandiseById = createAsyncThunk(
  "merchandise/getMerchandiseById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/merchandise/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response.data.msg || "Failed to fetch merchandise item",
      );
    }
  },
);

// Create new merchandise
export const createMerchandise = createAsyncThunk(
  "merchandise/createMerchandise",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post("/api/merchandise", formData);

      dispatch(
        setAlert({
          msg: "Merchandise created successfully!",
          type: "success",
        }),
      );

      return res.data;
    } catch (err) {
      dispatch(
        setAlert({
          msg: err.response.data.msg || "Failed to create merchandise",
          type: "error",
        }),
      );

      return rejectWithValue(
        err.response.data.msg || "Merchandise creation failed",
      );
    }
  },
);

// Update merchandise
export const updateMerchandise = createAsyncThunk(
  "merchandise/updateMerchandise",
  async ({ id, formData }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/merchandise/${id}`, formData);

      dispatch(
        setAlert({
          msg: "Merchandise updated successfully!",
          type: "success",
        }),
      );

      return res.data;
    } catch (err) {
      dispatch(
        setAlert({
          msg: err.response.data.msg || "Failed to update merchandise",
          type: "error",
        }),
      );

      return rejectWithValue(
        err.response.data.msg || "Merchandise update failed",
      );
    }
  },
);

// Delete merchandise
export const deleteMerchandise = createAsyncThunk(
  "merchandise/deleteMerchandise",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(`/api/merchandise/${id}`);

      dispatch(
        setAlert({
          msg: "Merchandise deleted successfully!",
          type: "success",
        }),
      );

      return id;
    } catch (err) {
      dispatch(
        setAlert({
          msg: err.response.data.msg || "Failed to delete merchandise",
          type: "error",
        }),
      );

      return rejectWithValue(
        err.response.data.msg || "Merchandise deletion failed",
      );
    }
  },
);

// Initial state
const initialState = {
  merchandise: [],
  creatorMerchandise: [],
  characterMerchandise: [],
  product: null,
  loading: false,
  error: null,
};

// Slice
const merchandiseSlice = createSlice({
  name: "merchandise",
  initialState,
  reducers: {
    clearProduct: (state) => {
      state.product = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all merchandise
      .addCase(getMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.merchandise = action.payload;
      })
      .addCase(getMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get creator merchandise
      .addCase(getCreatorMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCreatorMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.creatorMerchandise = action.payload;
      })
      .addCase(getCreatorMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get character merchandise
      .addCase(getCharacterMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCharacterMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.characterMerchandise = action.payload;
      })
      .addCase(getCharacterMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get merchandise by ID
      .addCase(getMerchandiseById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMerchandiseById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(getMerchandiseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create new merchandise
      .addCase(createMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.creatorMerchandise.unshift(action.payload);
        state.merchandise.unshift(action.payload);
      })
      .addCase(createMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update merchandise
      .addCase(updateMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
        state.creatorMerchandise = state.creatorMerchandise.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
        state.merchandise = state.merchandise.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
        state.characterMerchandise = state.characterMerchandise.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        );
      })
      .addCase(updateMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete merchandise
      .addCase(deleteMerchandise.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMerchandise.fulfilled, (state, action) => {
        state.loading = false;
        state.creatorMerchandise = state.creatorMerchandise.filter(
          (item) => item._id !== action.payload,
        );
        state.merchandise = state.merchandise.filter(
          (item) => item._id !== action.payload,
        );
        state.characterMerchandise = state.characterMerchandise.filter(
          (item) => item._id !== action.payload,
        );
        if (state.product && state.product._id === action.payload) {
          state.product = null;
        }
      })
      .addCase(deleteMerchandise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProduct, clearError } = merchandiseSlice.actions;

export default merchandiseSlice.reducer;
