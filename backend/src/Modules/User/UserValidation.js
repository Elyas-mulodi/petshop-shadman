import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام خیلی طولانی است")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("فرمت ایمیل معتبر نیست")
    .max(100, "ایمیل خیلی طولانی است")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string(requiredMsg("رمز عبور فعلی"))
    .min(1, "رمز عبور فعلی الزامی است")
    .max(50, "رمز عبور فعلی معتبر نیست"),
  newPassword: z
    .string(requiredMsg("رمز عبور جدید"))
    .min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد")
    .max(50, "رمز عبور جدید خیلی طولانی است"),
});

export const getAdminUsersQuerySchema = z.object({
  search: z.string().trim().max(60).optional(),
  status: z
    .enum(["active", "blocked", "unverified"], { error: "وضعیت نامعتبر است" })
    .optional(),
  sort: z
    .enum(["newest", "oldest", "nameAsc"], { error: "مرتب‌سازی نامعتبر است" })
    .optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const blockUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, "دلیل حداکثر ۳۰۰ کاراکتر می‌تواند باشد")
    .optional(),
});

export const addUserNoteSchema = z.object({
  text: z
    .string(requiredMsg("متن یادداشت"))
    .trim()
    .min(1, "متن یادداشت الزامی است")
    .max(1000, "یادداشت خیلی طولانی است"),
});
