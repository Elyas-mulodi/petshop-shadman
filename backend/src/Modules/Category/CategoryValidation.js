import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const nameField = z
  .string(requiredMsg("نام دسته‌بندی"))
  .trim()
  .min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد")
  .max(50, "نام دسته‌بندی نباید بیشتر از ۵۰ کاراکتر باشد");

const parentField = z
  .string()
  .regex(objectIdRegex, "شناسه دسته‌بندی والد معتبر نیست")
  .optional()
  .nullable()
  .or(z.literal(""));

const isActiveField = z
  .enum(["true", "false"], { error: "مقدار isActive باید true یا false باشد" })
  .optional();

export const createCategorySchema = z.object({
  name: nameField,
  parent: parentField,
  isActive: isActiveField,
});

export const updateCategorySchema = z.object({
  name: nameField.optional(),
  parent: parentField,
  isActive: isActiveField,
});