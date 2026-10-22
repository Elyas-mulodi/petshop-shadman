import axiosInstance from "../../utils/axiosInstance";

export const getShippingConfig = () =>
  axiosInstance.get("/orders/shipping-config");
export const createOrder = (payload) => axiosInstance.post("/orders", payload);

export const getMyOrders = () => axiosInstance.get("/orders/my-orders");
export const retryOrderPayment = (id) =>
  axiosInstance.post(`/orders/${id}/pay`);
export const cancelOrder = (id) => axiosInstance.patch(`/orders/${id}/cancel`);
export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`);
