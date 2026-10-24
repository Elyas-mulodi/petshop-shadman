import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد").max(50, "نام خیلی طولانی است").optional(),
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