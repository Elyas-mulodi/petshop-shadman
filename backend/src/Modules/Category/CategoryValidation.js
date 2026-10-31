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

const boolString = (message) =>
  z.enum(["true", "false"], { error: message }).optional();

// فرم multipart است، پس عددها به‌صورت رشته می‌رسن
const sortOrderField = z
  .string()
  .regex(/^\d{1,4}$/, "ترتیب نمایش باید عددی بین ۰ تا ۹۹۹۹ باشد")
  .optional();

export const createCategorySchema = z.object({
  name: nameField,
  parent: parentField,
  isActive: boolString("مقدار isActive باید true یا false باشد"),
  sortOrder: sortOrderField,
});

export const updateCategorySchema = z.object({
  name: nameField.optional(),
  parent: parentField,
  isActive: boolString("مقدار isActive باید true یا false باشد"),
  sortOrder: sortOrderField,
  removeImage: boolString("مقدار removeImage باید true یا false باشد"),
});
