import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string({ required_error: "کد تخفیف الزامی است" })
    .trim()
    .min(3, "کد تخفیف باید حداقل ۳ کاراکتر باشد")
    .max(20, "کد تخفیف نباید بیشتر از ۲۰ کاراکتر باشد")
    .regex(/^[a-zA-Z0-9]+$/, "کد تخفیف فقط می‌تواند شامل حروف و اعداد انگلیسی باشد"),
  discountType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "نوع تخفیف باید percentage یا fixed باشد" }),
  }),
  discountValue: z
    .number({ invalid_type_error: "مقدار تخفیف باید عدد باشد" })
    .positive("مقدار تخفیف باید بزرگ‌تر از صفر باشد"),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minCartAmount: z.number().min(0).optional(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})
  .refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    { message: "مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد", path: ["discountValue"] }
  );

export const applyCouponSchema = z.object({
  code: z.string({ required_error: "کد تخفیف الزامی است" }).trim(),
});