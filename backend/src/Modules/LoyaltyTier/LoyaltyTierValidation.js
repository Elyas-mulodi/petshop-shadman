import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

export const createLoyaltyTierSchema = z.object({
  minOrderAmount: z
    .number(requiredMsg("حداقل مبلغ سفارش"))
    .int("مبلغ باید عدد صحیح باشد")
    .min(0, "مبلغ نمی‌تواند منفی باشد")
    .max(1_000_000_000, "مبلغ بیش از حد مجاز است"),
  discountPercent: z
    .number(requiredMsg("درصد تخفیف"))
    .gt(0, "درصد تخفیف باید بیشتر از صفر باشد")
    .max(100, "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد"),
  isActive: z.boolean(requiredMsg("وضعیت فعال بودن")).optional(),
});

export const updateLoyaltyTierSchema = createLoyaltyTierSchema.partial();
