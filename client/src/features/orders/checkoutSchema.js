import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(3, "نام و نام خانوادگی گیرنده را وارد کنید"),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود"),
  province: z.string().min(1, "استان را انتخاب کنید"),
  city: z.string().min(1, "شهر را انتخاب کنید"),
  addressLine: z
    .string()
    .trim()
    .min(10, "آدرس را کامل‌تر وارد کنید (حداقل ۱۰ کاراکتر)"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
});
