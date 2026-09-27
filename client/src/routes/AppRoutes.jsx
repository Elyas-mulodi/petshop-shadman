import { Routes, Route } from "react-router-dom";
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
import MyOrdersPage from "../pages/shop/MyOrdersPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;