import { z } from "zod";
import { BANNER_ICONS, BANNER_SLOTS } from "./BannerMd.js";

const requiredMsg = (label) => ({
  error: (issue) =>
    issue.input === undefined ? `${label} الزامی است` : `${label} معتبر نیست`,
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "شناسه معتبر نیست");

// مسیر داخلی سایت یا https (بدون فاصله و بک‌اسلش؛ جلوی javascript: و //host هم گرفته می‌شه)
const link = z
  .string()
  .trim()
  .max(300, "لینک خیلی طولانی است")
  .refine((v) => !/[\\\s\x00-\x1f]/.test(v), "لینک نباید فاصله یا بک‌اسلش داشته باشد")
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v),
    "لینک باید مسیر داخلی (مثل /products) یا آدرس کامل https باشد",
  );

// فقط فایل‌هایی که خود سیستم از /banners/admin/upload آپلود کرده
const imageUrl = z
  .string()
  .trim()
  .regex(/^\/uploads\/banners\/[A-Za-z0-9._-]+$/, "آدرس تصویر معتبر نیست");
const focalAxis = z.number(requiredMsg("نقطه‌ی مهم تصویر")).min(0).max(100);

const fields = {
  slot: z.enum(BANNER_SLOTS, { error: "تایل بنر نامعتبر است" }),
  eyebrow: z.string().trim().max(60, "حداکثر ۶۰ کاراکتر").optional(),
  title: z
    .string(requiredMsg("عنوان بنر"))
    .trim()
    .min(2, "عنوان خیلی کوتاه است")
    .max(120, "عنوان خیلی طولانی است"),
  subtitle: z.string().trim().max(300, "حداکثر ۳۰۰ کاراکتر").optional(),
  badge: z.string().trim().max(40, "حداکثر ۴۰ کاراکتر").optional(),
  ctaText: z.string().trim().max(40, "حداکثر ۴۰ کاراکتر").optional(),
  ctaLink: link.or(z.literal("")).optional(),
  image: imageUrl.nullable().optional(), // الزامی بودنش برای tall/square توی مدل چک میشه
  imageAlt: z.string().trim().max(150, "حداکثر ۱۵۰ کاراکتر").optional(),
  imageMobile: imageUrl.nullable().optional(),
  sectionKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,30}$/, "کلید بخش نامعتبر است")
    .or(z.literal(""))
    .optional(),
  focalPoint: z.object({ x: focalAxis, y: focalAxis }).optional(),
  overlay: z
    .number()
    .int("تیرگی باید عدد صحیح باشد")
    .min(0)
    .max(80, "تیرگی حداکثر ۸۰ است")
    .optional(),
  icon: z
    .enum(BANNER_ICONS, { error: "آیکون نامعتبر است" })
    .nullable()
    .optional(),
  order: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
};

export const createBannerSchema = z.object(fields);
export const updateBannerSchema = z.object(fields).partial();

export const publicBannersQuerySchema = z.object({
  slot: z.enum(BANNER_SLOTS, { error: "تایل بنر نامعتبر است" }).optional(),
});

export const bannerIdParamSchema = z.object({ id: objectId });
