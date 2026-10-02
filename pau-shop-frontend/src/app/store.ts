import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import cartReducer, { saveCart } from "../features/cart/cartSlice";
import productsReducer from "../features/products/productsSlice";
import shippingReducer from "../features/shipping/shippingSlice";
import orderReducer from "../features/orders/orderSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import addressReducer from "../features/address/addressSlice";
import profileReducer from "../features/profile/profileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    cart: cartReducer,
    products: productsReducer,
    shipping: shippingReducer,
    order: orderReducer,
    checkout: checkoutReducer,
    address: addressReducer,
  },
});

// Save the cart whenever it changes.
let savedCart = store.getState().cart.items;
store.subscribe(() => {
  const items = store.getState().cart.items;
  if (items !== savedCart) {
    savedCart = items;
    saveCart(items);
  }
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
