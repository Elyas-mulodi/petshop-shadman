import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string({ required_error: "نام گیرنده الزامی است" }).trim().min(3, "نام باید حداقل ۳ کاراکتر باشد"),
    phone: z.string({ required_error: "شماره تماس الزامی است" }).regex(/^09\d{9}$/, "فرمت شماره موبایل معتبر نیست"),
    province: z.string({ required_error: "استان الزامی است" }).trim().min(2, "استان الزامی است"),
    city: z.string({ required_error: "شهر الزامی است" }).trim().min(2, "شهر الزامی است"),
    addressLine: z.string({ required_error: "آدرس دقیق الزامی است" }).trim().min(10, "آدرس باید کامل‌تر وارد شود"),
    postalCode: z.string({ required_error: "کد پستی الزامی است" }).regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  }),
  couponCode: z.string().trim().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled", "returned"], {
    errorMap: () => ({ message: "وضعیت نامعتبر است" }),
  }),
});