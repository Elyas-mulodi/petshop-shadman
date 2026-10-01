import axiosInstance from "../../utils/axiosInstance";

export const getBrands = () => axiosInstance.get("/brands");