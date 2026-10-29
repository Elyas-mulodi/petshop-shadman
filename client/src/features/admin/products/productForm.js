import { normalizeDigits } from "../../../utils/authHelpers";
import { toTehranDay } from "../../../utils/tehranDate";

export const DEFAULT_ATTRIBUTES = {
  وزن: [
    "500 گرم",
    "1 کیلوگرم",
    "2 کیلوگرم",
    "3 کیلوگرم",
    "5 کیلوگرم",
    "10 کیلوگرم",
    "15 کیلوگرم",
    "20 کیلوگرم",
  ],
  طعم: [
    "مرغ",
    "گوشت گاو",
    "ماهی",
    "ماهی تن",
    "سالمون",
    "بره",
    "بوقلمون",
    "مخلوط",
  ],
  رنگ: ["مشکی", "قهوه‌ای", "سفید", "قرمز", "آبی", "سبز", "صورتی", "طوسی"],
  سایز: ["کوچک", "متوسط", "بزرگ", "خیلی بزرگ"],
  حجم: ["100 میلی‌لیتر", "250 میلی‌لیتر", "500 میلی‌لیتر", "1 لیتر"],
  "تعداد در بسته": ["1 عدد", "6 عدد", "12 عدد", "24 عدد"],
  "گروه سنی": ["توله", "بالغ", "سالمند"],
};

// ویژگی‌های واقعاً استفاده‌شده توی فروشگاه اول میان، بعد پیش‌فرض‌ها
export const mergeSuggestions = (serverRows = []) => {
  const map = new Map();

  for (const { name, values } of serverRows) map.set(name, [...values]);

  for (const [name, values] of Object.entries(DEFAULT_ATTRIBUTES)) {
    const list = map.get(name) ?? [];
    for (const value of values) if (!list.includes(value)) list.push(value);
    map.set(name, list);
  }

  return map;
};

let counter = 0;
export const uid = () => `new-${++counter}`;

export const emptyAttribute = () => ({ name: "", value: "" });
export const emptyVariant = () => ({
  key: uid(),
  _id: null,
  attributes: [emptyAttribute()],
  price: "",
  stock: "0",
  sku: "",
});

export const emptyForm = () => ({
  name: "",
  description: "",
  brand: "",
  categories: [],
  variants: [emptyVariant()],
  discountPercent: "0",
  discountStartDate: "",
  discountEndDate: "",
  isActive: true,
});

export const productToForm = (p) => ({
  name: p.name,
  description: p.description,
  brand: String(p.brand ?? ""),
  categories: (p.categories ?? []).map(String),
  variants: p.variants.map((v) => ({
    key: v._id,
    _id: v._id,
    attributes: v.attributes.map(({ name, value }) => ({ name, value })),
    price: String(v.price),
    stock: String(v.stock),
    sku: v.sku ?? "",
  })),
  discountPercent: String(p.discountPercent ?? 0),
  discountStartDate: p.discountStartDate
    ? toTehranDay(new Date(p.discountStartDate))
    : "",
  discountEndDate: p.discountEndDate
    ? toTehranDay(new Date(p.discountEndDate))
    : "",
  isActive: !!p.isActive,
});

// برای تشخیص تغییر ذخیره‌نشده (کلیدهای محلی واریانت‌ها حساب نمی‌شن)
export const snapshot = (form) =>
  JSON.stringify({
    ...form,
    variants: form.variants.map(({ key: _key, ...rest }) => rest),
  });

// "1,200,000" و ارقام فارسی هم پذیرفته می‌شن؛ نتیجه‌ی نامعتبر NaN است
export const toNumber = (value) => {
  const text = normalizeDigits(String(value ?? "")).replace(/[,٬\s]/g, "");
  return /^\d+$/.test(text) ? Number(text) : NaN;
};

export const finalPrice = (price, percent) =>
  Math.round(price - (price * percent) / 100);

export const discountState = (form, today) => {
  const percent = toNumber(form.discountPercent);
  if (!(percent > 0)) return "none";
  if (form.discountStartDate && today < form.discountStartDate)
    return "scheduled";
  if (form.discountEndDate && today > form.discountEndDate) return "expired";
  return "active";
};

const trimmed = (v) => ({ name: v.name.trim(), value: v.value.trim() });

export const validateProductForm = (form) => {
  const errors = {};

  const name = form.name.trim();
  if (name.length < 2) errors.name = "نام محصول باید حداقل ۲ کاراکتر باشد";
  else if (name.length > 150) errors.name = "نام محصول خیلی طولانی است";

  const description = form.description.trim();
  if (description.length < 10)
    errors.description = "توضیحات باید حداقل ۱۰ کاراکتر باشد";
  else if (description.length > 5000)
    errors.description = "توضیحات خیلی طولانی است";

  if (!form.brand) errors.brand = "برند را انتخاب کنید";
  if (form.categories.length === 0)
    errors.categories = "حداقل یک دسته‌بندی انتخاب کنید";
  if (form.variants.length === 0) errors.variants = "حداقل یک واریانت لازم است";

  const seenSkus = new Set();
  const seenCombos = new Map();

  form.variants.forEach((variant, i) => {
    const rows = variant.attributes.map(trimmed);
    const filled = rows.filter((a) => a.name || a.value);

    if (filled.length === 0)
      errors[`variants.${i}.attributes`] = "حداقل یک ویژگی لازم است";

    const names = new Set();
    rows.forEach((a, j) => {
      if (!a.name && !a.value) return; // ردیف کاملاً خالی نادیده گرفته می‌شه

      if (!a.name)
        errors[`variants.${i}.attributes.${j}.name`] = "نام ویژگی را وارد کنید";
      else if (a.name.length > 40)
        errors[`variants.${i}.attributes.${j}.name`] =
          "نام ویژگی خیلی طولانی است";
      else if (names.has(a.name))
        errors[`variants.${i}.attributes.${j}.name`] = "این ویژگی تکراری است";
      else names.add(a.name);

      if (!a.value)
        errors[`variants.${i}.attributes.${j}.value`] = "مقدار را وارد کنید";
      else if (a.value.length > 80)
        errors[`variants.${i}.attributes.${j}.value`] = "مقدار خیلی طولانی است";
    });

    const price = toNumber(variant.price);
    if (Number.isNaN(price))
      errors[`variants.${i}.price`] = "قیمت را به‌صورت عدد صحیح وارد کنید";
    else if (price <= 0)
      errors[`variants.${i}.price`] = "قیمت باید بیشتر از صفر باشد";
    else if (price > 1_000_000_000)
      errors[`variants.${i}.price`] = "قیمت بیش از حد مجاز است";

    if (!variant._id) {
      const stock = toNumber(variant.stock);
      if (Number.isNaN(stock))
        errors[`variants.${i}.stock`] = "موجودی را به‌صورت عدد صحیح وارد کنید";
      else if (stock > 1_000_000)
        errors[`variants.${i}.stock`] = "موجودی بیش از حد مجاز است";
    }

    const sku = variant.sku.trim();
    if (sku.length > 60) errors[`variants.${i}.sku`] = "SKU خیلی طولانی است";
    else if (sku) {
      if (seenSkus.has(sku.toLowerCase()))
        errors[`variants.${i}.sku`] =
          "این SKU برای واریانت دیگری هم وارد شده است";
      seenSkus.add(sku.toLowerCase());
    }

    if (filled.length > 0) {
      const combo = filled
        .map((a) => `${a.name}=${a.value}`)
        .sort()
        .join("|");
      if (seenCombos.has(combo)) {
        errors[`variants.${i}.duplicate`] =
          `ویژگی‌های این واریانت با واریانت ${seenCombos.get(combo) + 1} یکسان است`;
      } else {
        seenCombos.set(combo, i);
      }
    }
  });

  const percent = toNumber(form.discountPercent);
  if (Number.isNaN(percent))
    errors.discountPercent = "درصد تخفیف را وارد کنید (برای بدون تخفیف، ۰)";
  else if (percent > 100)
    errors.discountPercent = "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد";
  else if (
    percent > 0 &&
    form.discountStartDate &&
    form.discountEndDate &&
    form.discountEndDate < form.discountStartDate
  ) {
    errors.discountEndDate = "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد";
  }

  return errors;
};

// بدنه‌ی JSON برای POST /products و PUT /products/:id (روز تخفیف به وقت تهران)
export const formToPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  brand: form.brand,
  categories: form.categories,
  variants: form.variants.map((v) => ({
    ...(v._id && { _id: v._id }),
    attributes: v.attributes.map(trimmed).filter((a) => a.name && a.value),
    price: toNumber(v.price),
    stock: toNumber(v.stock),
    ...(v.sku.trim() && { sku: v.sku.trim() }),
  })),
  discountPercent: toNumber(form.discountPercent),
  discountStartDate: form.discountStartDate
    ? `${form.discountStartDate}T00:00:00+03:30`
    : "",
  discountEndDate: form.discountEndDate
    ? `${form.discountEndDate}T23:59:59.999+03:30`
    : "",
  isActive: form.isActive,
});
