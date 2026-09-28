import axiosInstance from "../../utils/axiosInstance";

export const getCategoryTree = () => axiosInstance.get("/categories");