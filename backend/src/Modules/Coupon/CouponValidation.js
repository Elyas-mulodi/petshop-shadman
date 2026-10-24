import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const couponBase = z.object({
  code: z
    .string(requiredMsg("کد تخفیف"))
    .trim()
    .min(3, "کد تخفیف باید حداقل ۳ کاراکتر باشد")
    .max(20, "کد تخفیف نباید بیشتر از ۲۰ کاراکتر باشد")
    .regex(/^[a-zA-Z0-9]+$/, "کد تخفیف فقط می‌تواند شامل حروف و اعداد انگلیسی باشد"),
  discountType: z.enum(["percentage", "fixed"], {
    error: "نوع تخفیف باید percentage یا fixed باشد",
  }),
  discountValue: z.number(requiredMsg("مقدار تخفیف")).positive("مقدار تخفیف باید بزرگ‌تر از صفر باشد"),
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
  expiresAt: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "تاریخ انقضا معتبر نیست")
    .nullable()
    .optional(),
  isActive: z.boolean(requiredMsg("وضعیت فعال بودن")).optional(),
});

const percentError = {
  message: "مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد",
  path: ["discountValue"],
};

export const createCouponSchema = couponBase.refine(
  (d) => d.discountType !== "percentage" || d.discountValue <= 100,
  percentError,
);

// ویرایش: هر فیلد اختیاریه. اگه فقط درصد عوض بشه، بررسی نهایی توی کنترلر انجام می‌شه
export const updateCouponSchema = couponBase
  .partial()
  .refine(
    (d) => !(d.discountType === "percentage" && d.discountValue !== undefined && d.discountValue > 100),
    percentError,
  );

export const applyCouponSchema = z.object({
  code: z.string(requiredMsg("کد تخفیف")).trim().min(1, "کد تخفیف الزامی است").max(20, "کد تخفیف معتبر نیست"),
});