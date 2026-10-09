import axiosInstance from "../../utils/axiosInstance";

export const getCart = () => axiosInstance.get("/cart");
export const addToCart = (productId, variantId, quantity) =>
  axiosInstance.post("/cart/add", { productId, variantId, quantity });
export const updateCartItem = (variantId, quantity) =>
  axiosInstance.put("/cart/update", { variantId, quantity });
export const removeCartItem = (variantId) =>
  axiosInstance.delete("/cart/remove", { data: { variantId } });
export const syncCart = (items) => axiosInstance.post("/cart/sync", { items });
export const previewCart = (items) =>
  axiosInstance.post("/cart/preview", { items });
