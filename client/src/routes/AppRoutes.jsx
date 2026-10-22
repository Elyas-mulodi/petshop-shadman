import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/shop/HomePage";

const LoginPage = lazy(() => import("../pages/shop/LoginPage"));
const RegisterPage = lazy(() => import("../pages/shop/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/shop/ForgotPasswordPage"));
const ProductListPage = lazy(() => import("../pages/shop/ProductListPage"));
const ProductDetailPage = lazy(() => import("../pages/shop/ProductDetailPage"));
const CartPage = lazy(() => import("../pages/shop/CartPage"));
const CheckoutPage = lazy(() => import("../pages/shop/CheckoutPage"));
const CheckoutResultPage = lazy(() => import("../pages/shop/CheckoutResultPage"));
const CategoriesPage = lazy(() => import("../pages/shop/CategoriesPage"));
const DiscountsPage = lazy(() => import("../pages/shop/DiscountsPage"));
const ProfilePage = lazy(() => import("../pages/shop/ProfilePage"));
const OrderDetailPage = lazy(() => import("../pages/shop/OrderDetailPage"));
const NotFoundPage = lazy(() => import("../pages/shop/NotFoundPage"));

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
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/my-orders" element={<Navigate to="/profile?tab=orders" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;