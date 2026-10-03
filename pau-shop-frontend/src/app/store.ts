import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import cartReducer, { saveCart } from "../features/cart/cartSlice";
import productsReducer from "../features/products/productsSlice";
import shippingReducer from "../features/shipping/shippingSlice";
import orderReducer from "../features/orders/orderSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import addressReducer from "../features/address/addressSlice";
import profileReducer from "../features/profile/profileSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  cart: cartReducer,
  products: productsReducer,
  shipping: shippingReducer,
  order: orderReducer,
  checkout: checkoutReducer,
  address: addressReducer,
});

// Tests build their own store (optionally with a starting state).
export function makeStore(preloadedState?: Partial<ReturnType<typeof rootReducer>>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export const store = makeStore();

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
