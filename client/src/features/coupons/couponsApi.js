import axiosInstance from "../../utils/axiosInstance";

export const applyCoupon = (code) =>
  axiosInstance.post("/coupons/apply", { code });
