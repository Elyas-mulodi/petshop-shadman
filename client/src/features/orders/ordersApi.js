import axiosInstance from "../../utils/axiosInstance";

export const getShippingConfig = () =>
  axiosInstance.get("/orders/shipping-config");
