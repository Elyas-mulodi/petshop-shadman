import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const whole = (label, max) =>
  z
    .number(requiredMsg(label))
    .int(`${label} باید عدد صحیح باشد`)
    .min(0, `${label} نمی‌تواند منفی باشد`)
    .max(max, `${label} بیش از حد مجاز است`);

export const updateSettingsSchema = z.object({
  shipping: z.object({
    cost: whole("هزینه‌ی ارسال", 10_000_000),
    freeThreshold: whole("حداقل خرید برای ارسال رایگان", 1_000_000_000),
  }),
  inventory: z.object({
    lowStockThreshold: whole("آستانه‌ی کم‌موجودی", 10_000),
  }),
  store: z.object({
    name: z
      .string(requiredMsg("نام فروشگاه"))
      .trim()
      .min(2, "نام فروشگاه باید حداقل ۲ کاراکتر باشد")
      .max(60, "نام فروشگاه خیلی طولانی است"),
    manager: z.string().trim().max(60, "نام مدیر خیلی طولانی است").default(""),
    phone: z
      .string()
      .trim()
      .max(20, "شماره تلفن خیلی طولانی است")
      .regex(/^[0-9+\-\s()]*$/, "تلفن فقط می‌تواند شامل عدد، + و - باشد")
      .default(""),
    address: z.string().trim().max(200, "آدرس خیلی طولانی است").default(""),
  }),
});
