import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// پیام فارسی برای «الزامی» و «نوع اشتباه»
const requiredMsg = (label) => ({
  error: (issue) =>
    issue.input === undefined ? `${label} الزامی است` : `${label} معتبر نیست`,
});

const objectId = (label = "شناسه") =>
  z.string(requiredMsg(label)).regex(objectIdRegex, `${label} معتبر نیست`);

const variantAttributeSchema = z.object({
  name: z
    .string(requiredMsg("نام ویژگی"))
    .trim()
    .min(1, "نام ویژگی الزامی است")
    .max(40, "نام ویژگی خیلی طولانی است"),
  value: z
    .string(requiredMsg("مقدار ویژگی"))
    .trim()
    .min(1, "مقدار ویژگی الزامی است")
    .max(80, "مقدار ویژگی خیلی طولانی است"),
});

const variantSchema = z.object({
  _id: objectId("شناسه واریانت").optional(), // فقط برای ویرایشِ واریانتِ موجود
  attributes: z
    .array(variantAttributeSchema, requiredMsg("ویژگی‌های واریانت"))
    .min(1, "هر واریانت باید حداقل یک ویژگی داشته باشد")
    .max(10, "حداکثر ۱۰ ویژگی برای هر واریانت مجاز است"),
  price: z
    .number(requiredMsg("قیمت"))
    .int("قیمت باید عدد صحیح باشد")
    .min(0, "قیمت نمی‌تواند منفی باشد")
    .max(1_000_000_000, "قیمت بیش از حد مجاز است"),
  stock: z
    .number(requiredMsg("موجودی"))
    .int("موجودی باید عدد صحیح باشد")
    .min(0, "موجودی نمی‌تواند منفی باشد")
    .max(1_000_000, "موجودی بیش از حد مجاز است"),
  sku: z
    .string()
    .trim()
    .max(60, "SKU خیلی طولانی است")
    .optional()
    .transform((value) => value || undefined), // رشته‌ی خالی نباید با unique ایندکس به مشکل بخوره
});

// فیلدهای multipart به‌صورت رشته‌ی JSON میان
const jsonArray = (itemSchema, label) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    z
      .array(itemSchema, {
        error: (issue) =>
          issue.input === undefined
            ? `${label} الزامی است`
            : `فرمت ${label} معتبر نیست`,
      })
      .min(1, `حداقل یک مورد برای ${label} لازم است`),
  );

const discountPercentField = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return 0;
    return typeof value === "string" ? Number(value) : value;
  },
  z
    .number({ error: "درصد تخفیف باید عدد باشد" })
    .min(0, "درصد تخفیف نمی‌تواند منفی باشد")
    .max(100, "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد"),
);

const dateField = z
  .preprocess(
    (value) => (value === "" ? null : value),
    z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), "تاریخ معتبر نیست")
      .nullable(),
  )
  .optional();

const productBase = z.object({
  name: z
    .string(requiredMsg("نام محصول"))
    .trim()
    .min(2, "نام محصول باید حداقل ۲ کاراکتر باشد")
    .max(150, "نام محصول خیلی طولانی است"),
  description: z
    .string(requiredMsg("توضیحات محصول"))
    .trim()
    .min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "توضیحات خیلی طولانی است"),
  brand: objectId("برند"),
  categories: jsonArray(objectId("شناسه دسته‌بندی"), "دسته‌بندی‌ها"),
  variants: jsonArray(variantSchema, "واریانت‌ها"),
  discountPercent: discountPercentField,
  discountStartDate: dateField,
  discountEndDate: dateField,
  isActive: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
});

const withDateCheck = (schema) =>
  schema.refine(
    (d) =>
      !(d.discountStartDate && d.discountEndDate) ||
      new Date(d.discountEndDate) >= new Date(d.discountStartDate),
    {
      message: "تاریخ پایان تخفیف نمی‌تواند قبل از تاریخ شروع باشد",
      path: ["discountEndDate"],
    },
  );

export const createProductSchema = withDateCheck(productBase);
export const updateProductSchema = withDateCheck(productBase.partial());

export const removeProductImageSchema = z.object({
  imageUrl: z
    .string(requiredMsg("آدرس عکس"))
    .trim()
    .min(1, "آدرس عکس الزامی است"),
});

export const getProductsQuerySchema = z.object({
  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}(,[0-9a-fA-F]{24})*$/, "شناسه دسته‌بندی معتبر نیست")
    .optional(),
  brand: z.string().regex(objectIdRegex, "شناسه برند معتبر نیست").optional(),
  search: z.string().optional(),
  minPrice: z.string().regex(/^\d+$/, "حداقل قیمت باید عدد باشد").optional(),
  maxPrice: z.string().regex(/^\d+$/, "حداکثر قیمت باید عدد باشد").optional(),
  inStock: z.enum(["true", "false"]).optional(),
  attrs: z.string().optional(), // رشته JSON مثل [{"name":"وزن","value":"3 کیلوگرم"}]
  sort: z.enum(["newest", "priceAsc", "priceDesc"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
