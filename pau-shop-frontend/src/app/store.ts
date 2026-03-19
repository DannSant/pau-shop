import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import cartReducer from "../features/cart/cartSlice";
import productsReducer from "../features/products/productsSlice";
import shippingReducer from "../features/shipping/shippingSlice";
import orderReducer from "../features/orders/orderSlice";
import paymentReducer from "../features/payments/paymentSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import addressReducer from "../features/address/addressSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    shipping: shippingReducer,
    order: orderReducer,
    payment: paymentReducer,
    checkout: checkoutReducer,
    address: addressReducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
