import axiosInstance from "../../utils/axiosInstance";

export const updateProfile = (payload) =>
  axiosInstance.put("/users/profile", payload);

export const changePassword = (payload) =>
  axiosInstance.put("/users/change-password", payload);
