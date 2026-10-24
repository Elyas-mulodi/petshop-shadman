import { z } from "zod";

const requiredMsg = (label) => ({
  error: (issue) =>
    issue.input === undefined ? `${label} الزامی است` : `${label} معتبر نیست`,
});

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z
      .string(requiredMsg("نام گیرنده"))
      .trim()
      .min(3, "نام باید حداقل ۳ کاراکتر باشد")
      .max(80, "نام خیلی طولانی است"),
    phone: z
      .string(requiredMsg("شماره تماس"))
      .regex(/^09\d{9}$/, "فرمت شماره موبایل معتبر نیست"),
    province: z
      .string(requiredMsg("استان"))
      .trim()
      .min(2, "استان الزامی است")
      .max(60),
    city: z.string(requiredMsg("شهر")).trim().min(2, "شهر الزامی است").max(60),
    addressLine: z
      .string(requiredMsg("آدرس دقیق"))
      .trim()
      .min(10, "آدرس باید کامل‌تر وارد شود")
      .max(500, "آدرس خیلی طولانی است"),
    postalCode: z
      .string(requiredMsg("کد پستی"))
      .regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  }),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["processing", "shipped", "delivered", "cancelled", "returned"],
    {
      error: "وضعیت نامعتبر است",
    },
  ),
});

const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به شکل YYYY-MM-DD باشد");

export const getAdminOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: "وضعیت نامعتبر است" }).optional(),
  search: z.string().trim().max(60).optional(),
  from: dayString.optional(),
  to: dayString.optional(),
  stockIssue: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
