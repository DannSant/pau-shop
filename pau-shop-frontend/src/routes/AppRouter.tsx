import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

import MainLayout from "../components/layout/MainLayout";

import HomePage from "../pages/public/HomePage";
import BrowsePage from "../pages/public/BrowsePage";
import ProductPage from "../pages/public/ProductPage";
import SearchPage from "../pages/public/SearchPage";

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

import ProfilePage from "../pages/user/ProfilePage";
import CheckoutPage from "../pages/user/CheckoutPage";

import CartPage from "../pages/user/CartPage";
import useAuthInit from "../hooks/useAuthInit";

export default function AppRouter() {
  useAuthInit();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
         {/* PUBLIC ROUTES */}
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

           {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Route>
          {/* ADMIN ROUTES */}
         {/*  <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
          </Route> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
