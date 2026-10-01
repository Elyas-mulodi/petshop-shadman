import axiosInstance from "../../utils/axiosInstance";

export const getProducts = (params) => axiosInstance.get("/products", { params });
export const getNewProducts = () => axiosInstance.get("/products/new");
export const getDiscountedProducts = () => axiosInstance.get("/products/discounted");
export const getProductBySlug = (slug) => axiosInstance.get(`/products/${slug}`);