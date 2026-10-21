import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/shop/HomePage";
import LoginPage from "../pages/shop/LoginPage";
import RegisterPage from "../pages/shop/RegisterPage";
import ProductListPage from "../pages/shop/ProductListPage";
import ProductDetailPage from "../pages/shop/ProductDetailPage";
import CartPage from "../pages/shop/CartPage";
import CheckoutPage from "../pages/shop/CheckoutPage";
import ProfilePage from "../pages/shop/ProfilePage";
import CategoriesPage from "../pages/shop/CategoriesPage";
import DiscountsPage from "../pages/shop/DiscountsPage";
import ForgotPasswordPage from "../pages/shop/ForgotPasswordPage";
import CheckoutResultPage from "../pages/shop/CheckoutResultPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout/result" element={<CheckoutResultPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/discounts" element={<DiscountsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/my-orders"
            element={<Navigate to="/profile?tab=orders" replace />}
          />{" "}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
