import { z } from "zod";

const phoneRegex = /^09\d{9}$/;

export const sendOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, "فرمت شماره موبایل معتبر نیست"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, "فرمت شماره موبایل معتبر نیست"),
  otp: z.string().length(4, "کد تایید باید ۴ رقمی باشد"),
});

export const setPasswordSchema = z.object({
  registrationToken: z.string().min(1, "توکن ثبت‌نام الزامی است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, "فرمت شماره موبایل معتبر نیست"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "توکن بازیابی الزامی است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

export const createAdminSchema = z.object({
  phone: z.string().regex(phoneRegex, "فرمت شماره موبایل معتبر نیست"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});