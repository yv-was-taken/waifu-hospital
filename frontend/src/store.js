import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import characterReducer from "./features/characters/characterSlice";
import merchandiseReducer from "./features/merchandise/merchandiseSlice";
import cartReducer from "./features/cart/cartSlice";
import alertReducer from "./features/alerts/alertSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    character: characterReducer,
    merchandise: merchandiseReducer,
    cart: cartReducer,
    alert: alertReducer,
  },
});
