import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const phoneRegex = /^09\d{9}$/;
const digitsOnlyRegex = /^\d+$/;

const phoneField = z
  .string(requiredMsg("شماره موبایل"))
  .trim()
  .regex(phoneRegex, "شماره موبایل باید ۱۱ رقمی و با فرمت 09xxxxxxxxx باشد");

const passwordField = z
  .string(requiredMsg("رمز عبور"))
  .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
  .max(50, "رمز عبور خیلی طولانی است");

const otpField = z
  .string(requiredMsg("کد تایید"))
  .trim()
  .length(4, "کد تایید باید ۴ رقمی باشد")
  .regex(digitsOnlyRegex, "کد تایید باید فقط شامل عدد باشد");

export const sendOtpSchema = z.object({
  phone: phoneField,
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  otp: otpField,
});

export const setPasswordSchema = z.object({
  registrationToken: z.string(requiredMsg("توکن ثبت‌نام")).min(10, "توکن نامعتبر است"),
  password: passwordField,
});

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string(requiredMsg("رمز عبور")).min(1, "رمز عبور الزامی است").max(50, "رمز عبور خیلی طولانی است"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string(requiredMsg("توکن بازیابی")).min(10, "توکن نامعتبر است"),
  password: passwordField,
});

export const createAdminSchema = z.object({
  phone: phoneField,
  password: passwordField,
});