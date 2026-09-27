import axiosInstance from "../../utils/axiosInstance";

// ---------- ثبت‌نام مرحله‌ای ----------
export const sendRegisterOtp = (phone) =>
  axiosInstance.post("/auth/register/send-otp", { phone });

export const verifyRegisterOtp = (phone, otp) =>
  axiosInstance.post("/auth/register/verify-otp", { phone, otp });

export const setRegisterPassword = (registrationToken, password) =>
  axiosInstance.post("/auth/register/set-password", { registrationToken, password });

// ---------- ورود / خروج ----------
export const login = (phone, password) =>
  axiosInstance.post("/auth/login", { phone, password });

export const logout = () => axiosInstance.post("/auth/logout");

export const refreshToken = () => axiosInstance.post("/auth/refresh-token");

// ---------- فراموشی رمز عبور ----------
export const sendForgotPasswordOtp = (phone) =>
  axiosInstance.post("/auth/forgot-password/send-otp", { phone });

export const verifyForgotPasswordOtp = (phone, otp) =>
  axiosInstance.post("/auth/forgot-password/verify-otp", { phone, otp });

export const resetPassword = (resetToken, password) =>
  axiosInstance.post("/auth/forgot-password/reset-password", { resetToken, password });

// ---------- پروفایل ----------
export const getProfile = () => axiosInstance.get("/users/profile");