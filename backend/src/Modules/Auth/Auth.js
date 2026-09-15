import express from "express";
import rateLimit from "express-rate-limit";
import validate from "../../Middlewares/validate.js";
import { verifyAdminSecret } from "../../Middlewares/auth.js";
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  setRegisterPassword,
  login,
  refreshAccessToken,
  logout,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  createAdmin,
} from "./AuthCn.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  setPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  createAdminSchema,
} from "./AuthValidation.js";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, message: "تعداد درخواست‌های شما بیش از حد مجاز است" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "تعداد تلاش‌های شما بیش از حد مجاز است" },
});

// ---------- ثبت‌نام ----------
router.post("/register/send-otp", otpLimiter, validate(sendOtpSchema), sendRegisterOtp);
router.post("/register/verify-otp", validate(verifyOtpSchema), verifyRegisterOtp);
router.post("/register/set-password", validate(setPasswordSchema), setRegisterPassword);

// ---------- ورود / خروج ----------
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

// ---------- فراموشی رمز عبور ----------
router.post("/forgot-password/send-otp", otpLimiter, validate(sendOtpSchema), sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", validate(verifyOtpSchema), verifyForgotPasswordOtp);
router.post("/forgot-password/reset-password", validate(resetPasswordSchema), resetPassword);

// ---------- ساخت ادمین اولیه ----------
router.post("/create-admin", verifyAdminSecret, validate(createAdminSchema), createAdmin);

export default router;