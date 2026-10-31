import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const dateField = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "تاریخ معتبر نیست")
  .nullable()
  .optional();

const couponBase = z.object({
  code: z
    .string(requiredMsg("کد تخفیف"))
    .trim()
    .min(3, "کد تخفیف باید حداقل ۳ کاراکتر باشد")
    .max(20, "کد تخفیف نباید بیشتر از ۲۰ کاراکتر باشد")
    .regex(
      /^[a-zA-Z0-9]+$/,
      "کد تخفیف فقط می‌تواند شامل حروف و اعداد انگلیسی باشد",
    ),
  discountType: z.enum(["percentage", "fixed"], {
    error: "نوع تخفیف باید percentage یا fixed باشد",
  }),
  discountValue: z
    .number(requiredMsg("مقدار تخفیف"))
    .positive("مقدار تخفیف باید بزرگ‌تر از صفر باشد")
    .max(1_000_000_000),
  maxDiscountAmount: z
    .number(requiredMsg("سقف تخفیف"))
    .int("سقف تخفیف باید عدد صحیح باشد")
    .positive("سقف تخفیف باید بزرگ‌تر از صفر باشد")
    .nullable()
    .optional(),
  minCartAmount: z
    .number(requiredMsg("حداقل مبلغ سبد"))
    .int("حداقل مبلغ سبد باید عدد صحیح باشد")
    .min(0, "حداقل مبلغ سبد نمی‌تواند منفی باشد")
    .optional(),
  startsAt: dateField,
  expiresAt: dateField,
  usageLimit: z
    .number(requiredMsg("سقف استفاده"))
    .int("سقف استفاده باید عدد صحیح باشد")
    .min(1, "سقف استفاده باید حداقل ۱ باشد")
    .max(1_000_000)
    .nullable()
    .optional(),
  isActive: z.boolean(requiredMsg("وضعیت فعال بودن")).optional(),
});

const percentError = {
  message: "مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد",
  path: ["discountValue"],
};

const dateOrderError = {
  message: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد",
  path: ["expiresAt"],
};

const dateOrderOk = (d) =>
  !(d.startsAt && d.expiresAt) || new Date(d.expiresAt) >= new Date(d.startsAt);

export const createCouponSchema = couponBase
  .refine(
    (d) => d.discountType !== "percentage" || d.discountValue <= 100,
    percentError,
  )
  .refine(dateOrderOk, dateOrderError);

// ویرایش: هر فیلد اختیاریه. بررسی نهایی روی مقادیر ترکیب‌شده توی کنترلر انجام می‌شه
export const updateCouponSchema = couponBase
  .partial()
  .refine(
    (d) =>
      !(
        d.discountType === "percentage" &&
        d.discountValue !== undefined &&
        d.discountValue > 100
      ),
    percentError,
  )
  .refine(dateOrderOk, dateOrderError);

export const applyCouponSchema = z.object({
  code: z
    .string(requiredMsg("کد تخفیف"))
    .trim()
    .min(1, "کد تخفیف الزامی است")
    .max(20, "کد تخفیف معتبر نیست"),
});

export const getCouponsQuerySchema = z.object({
  search: z.string().trim().max(20).optional(),
  status: z
    .enum(["active", "scheduled", "expired", "exhausted", "disabled"], {
      error: "وضعیت نامعتبر است",
    })
    .optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
