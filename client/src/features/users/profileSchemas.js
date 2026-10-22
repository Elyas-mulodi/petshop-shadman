import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, "فرمت ایمیل معتبر نیست");

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام خیلی طولانی است"),
  email: emailField,
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
    newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد"),
    confirm: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "تکرار رمز عبور با رمز جدید یکسان نیست",
    path: ["confirm"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "رمز جدید باید با رمز فعلی متفاوت باشد",
    path: ["newPassword"],
  });