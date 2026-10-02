import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import ProfileCompletionGate from "./ProfileCompletionGate";
import AdminRoute from "./AdminRoute";

import MainLayout from "../components/layout/MainLayout";

import HomePage from "../pages/public/HomePage";
import BrowsePage from "../pages/public/BrowsePage";
import ProductPage from "../pages/public/ProductPage";
import NotFoundPage from "../pages/public/NotFoundPage";

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import CompleteProfilePage from "../pages/auth/CompleteProfilePage";

import ProfilePage from "../pages/user/ProfilePage";
import CheckoutPage from "../pages/user/CheckoutPage";
import OrderSuccessPage from "../pages/user/OrderSuccessPage";
import OrderDetailsPage from "../pages/user/OrderDetailsPage";

import CartPage from "../pages/user/CartPage";
import AdminPage from "../pages/admin/AdminPage";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage";
import useAuthInit from "../hooks/useAuthInit";

export default function AppRouter() {
  useAuthInit();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Users without a phone are sent to /complete-profile first. */}
          <Route element={<ProfileCompletionGate />}>
           {/* PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/products/:id" element={<ProductPage />} />

            {/* GUEST-ONLY ROUTES */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

             {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
              <Route path="/orders/:id" element={<OrderDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
            </Route>
            {/* ADMIN ROUTES */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/products/new" element={<AdminProductFormPage />} />
              <Route path="/admin/products/:id" element={<AdminProductFormPage />} />
            </Route>

            {/* Any other address */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
