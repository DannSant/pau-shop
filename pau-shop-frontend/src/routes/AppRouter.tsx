import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

import HomePage from "../pages/public/HomePage";
import BrowsePage from "../pages/public/BrowsePage";
import ProductPage from "../pages/public/ProductPage";
import SearchPage from "../pages/public/SearchPage";

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";

import ProfilePage from "../pages/user/ProfilePage";
import CheckoutPage from "../pages/user/CheckoutPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
