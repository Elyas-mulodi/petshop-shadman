import { z } from "zod";

const phoneField = z
  .string()
  .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود");

export const phoneOnlySchema = z.object({ phone: phoneField });

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirm: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "تکرار رمز عبور با رمز وارد شده یکسان نیست",
    path: ["confirm"],
  });