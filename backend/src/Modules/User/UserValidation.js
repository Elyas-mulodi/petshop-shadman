import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد").max(50, "نام خیلی طولانی است").optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("فرمت ایمیل معتبر نیست")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: "رمز عبور فعلی الزامی است" }).min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string({ required_error: "رمز عبور جدید الزامی است" }).min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد"),
});