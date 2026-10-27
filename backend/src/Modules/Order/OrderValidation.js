import { z } from "zod";

const requiredMsg = (label) => ({
  error: (issue) => (issue.input === undefined ? `${label} الزامی است` : `${label} معتبر نیست`),
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "شناسه معتبر نیست");

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "expired",
];

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string(requiredMsg("نام گیرنده")).trim().min(3, "نام باید حداقل ۳ کاراکتر باشد").max(80, "نام خیلی طولانی است"),
    phone: z.string(requiredMsg("شماره تماس")).regex(/^09\d{9}$/, "فرمت شماره موبایل معتبر نیست"),
    province: z.string(requiredMsg("استان")).trim().min(2, "استان الزامی است").max(60),
    city: z.string(requiredMsg("شهر")).trim().min(2, "شهر الزامی است").max(60),
    addressLine: z.string(requiredMsg("آدرس دقیق")).trim().min(10, "آدرس باید کامل‌تر وارد شود").max(500, "آدرس خیلی طولانی است"),
    postalCode: z.string(requiredMsg("کد پستی")).regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  }),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

const optionalText = (max) => z.string().trim().max(max, `حداکثر ${max} کاراکتر مجاز است`);

export const updateOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled", "returned"], {
    error: "وضعیت نامعتبر است",
  }),
  carrier: optionalText(60).optional(),
  trackingCode: optionalText(60).optional(),
});

export const updateShippingSchema = z.object({
  carrier: optionalText(60).nullable().optional(),
  trackingCode: optionalText(60).nullable().optional(),
});

export const addOrderNoteSchema = z.object({
  text: z.string(requiredMsg("متن یادداشت")).trim().min(1, "متن یادداشت الزامی است").max(1000, "یادداشت خیلی طولانی است"),
});

export const markRefundSchema = z.object({
  note: optionalText(300).optional(),
});

export const bulkStatusSchema = z.object({
  ids: z.array(objectId, requiredMsg("سفارش‌ها")).min(1, "حداقل یک سفارش انتخاب کنید").max(100, "حداکثر ۱۰۰ سفارش"),
  status: z.literal("processing", { error: "گروهی فقط وضعیت «در حال آماده‌سازی» قابل ثبت است" }),
});

const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به شکل YYYY-MM-DD باشد");

// لیست، شمارنده‌ها و خروجی سفارش‌های ادمین (تاریخ‌ها میلادی و YYYY-MM-DD؛ روز به وقت تهران)
export const getAdminOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: "وضعیت نامعتبر است" }).optional(),
  search: z.string().trim().max(60).optional(),
  from: dayString.optional(),
  to: dayString.optional(),
  stockIssue: z.enum(["true", "false"]).optional(),
  refundPending: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest", "totalDesc", "totalAsc"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});