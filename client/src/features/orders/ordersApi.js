import axiosInstance from "../../utils/axiosInstance";

export const getShippingConfig = () =>
  axiosInstance.get("/orders/shipping-config");
export const createOrder = (payload) => axiosInstance.post("/orders", payload);
