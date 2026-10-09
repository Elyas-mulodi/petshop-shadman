import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "شناسه معتبر نیست");

export const addToCartSchema = z.object({
  productId: objectId,
  variantId: objectId,
  quantity: z
    .number({ invalid_type_error: "تعداد باید عدد باشد" })
    .int("تعداد باید عدد صحیح باشد")
    .min(1, "تعداد باید حداقل ۱ باشد")
    .max(10, "حداکثر تعداد مجاز برای هر محصول ۱۰ عدد است"),
});

export const updateCartItemSchema = z.object({
  variantId: objectId,
  quantity: z
    .number({ invalid_type_error: "تعداد باید عدد باشد" })
    .int("تعداد باید عدد صحیح باشد")
    .min(1, "تعداد باید حداقل ۱ باشد")
    .max(10, "حداکثر تعداد مجاز برای هر محصول ۱۰ عدد است"),
});

export const removeCartItemSchema = z.object({
  variantId: objectId,
});

export const syncCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId,
        quantity: z.number().int().min(1).max(10),
      })
    )
    .max(50, "تعداد آیتم‌های سبد بیش از حد مجاز است")
    .default([]),
});