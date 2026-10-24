import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string(requiredMsg(label)).regex(objectIdRegex, `${label} معتبر نیست`);

const quantity = z
  .number(requiredMsg("تعداد"))
  .int("تعداد باید عدد صحیح باشد")
  .min(1, "تعداد باید حداقل ۱ باشد")
  .max(10, "حداکثر تعداد مجاز برای هر محصول ۱۰ عدد است");

export const addToCartSchema = z.object({
  productId: objectId("شناسه محصول"),
  variantId: objectId("شناسه واریانت"),
  quantity,
});

export const updateCartItemSchema = z.object({
  variantId: objectId("شناسه واریانت"),
  quantity,
});

export const removeCartItemSchema = z.object({
  variantId: objectId("شناسه واریانت"),
});

export const syncCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId("شناسه محصول"),
        variantId: objectId("شناسه واریانت"),
        quantity,
      }),
    )
    .max(50, "تعداد آیتم‌های سبد بیش از حد مجاز است")
    .default([]),
});