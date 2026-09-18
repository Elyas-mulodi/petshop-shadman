import { z } from "zod";

const phoneRegex = /^09\d{9}$/;
const digitsOnlyRegex = /^\d+$/;

const phoneField = z
  .string({ required_error: "شماره موبایل الزامی است" })
  .trim()
  .regex(phoneRegex, "شماره موبایل باید ۱۱ رقمی و با فرمت 09xxxxxxxxx باشد");

const passwordField = z
  .string({ required_error: "رمز عبور الزامی است" })
  .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
  .max(50, "رمز عبور خیلی طولانی است");

const otpField = z
  .string({ required_error: "کد تایید الزامی است" })
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
  registrationToken: z.string({ required_error: "توکن ثبت‌نام الزامی است" }).min(10, "توکن نامعتبر است"),
  password: passwordField,
});

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string({ required_error: "رمز عبور الزامی است" }).min(1, "رمز عبور الزامی است"),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string({ required_error: "توکن بازیابی الزامی است" }).min(10, "توکن نامعتبر است"),
  password: passwordField,
});

export const createAdminSchema = z.object({
  phone: phoneField,
  password: passwordField,
});