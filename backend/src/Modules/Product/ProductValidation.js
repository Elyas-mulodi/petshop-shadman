import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "شناسه معتبر نیست");

const variantAttributeSchema = z.object({
  name: z.string().trim().min(1, "نام ویژگی الزامی است"),
  value: z.string().trim().min(1, "مقدار ویژگی الزامی است"),
});

const variantSchema = z.object({
  attributes: z.array(variantAttributeSchema).min(1, "هر واریانت باید حداقل یک ویژگی داشته باشد"),
  price: z.number({ invalid_type_error: "قیمت باید عدد باشد" }).min(0, "قیمت نمی‌تواند منفی باشد"),
  stock: z.number({ invalid_type_error: "موجودی باید عدد باشد" }).min(0, "موجودی نمی‌تواند منفی باشد"),
});

const jsonArrayField = (schema, fieldLabel) =>
  z.string({ required_error: `${fieldLabel} الزامی است` }).transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const result = z.array(schema).min(1, `حداقل یک مورد برای ${fieldLabel} لازم است`).safeParse(parsed);
      if (!result.success) {
        result.error.errors.forEach((e) => ctx.addIssue(e));
        return z.NEVER;
      }
      return result.data;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `فرمت ${fieldLabel} معتبر نیست` });
      return z.NEVER;
    }
  });

const numericStringField = (label, opts = {}) =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === "") return opts.default ?? undefined;
      const num = Number(val);
      if (Number.isNaN(num)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} باید عدد باشد` });
        return z.NEVER;
      }
      return num;
    });

export const createProductSchema = z.object({
  name: z.string({ required_error: "نام محصول الزامی است" }).trim().min(2, "نام محصول باید حداقل ۲ کاراکتر باشد"),
  description: z.string({ required_error: "توضیحات محصول الزامی است" }).trim().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد"),
  brand: objectId,
  categories: jsonArrayField(objectId, "دسته‌بندی‌ها"),
  variants: jsonArrayField(variantSchema, "واریانت‌ها"),
  discountPercent: numericStringField("درصد تخفیف", { default: 0 }),
  discountStartDate: z.string().optional().nullable(),
  discountEndDate: z.string().optional().nullable(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const updateProductSchema = createProductSchema.partial();