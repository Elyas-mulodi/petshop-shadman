import { toNumber } from "../products/productForm";
import { dayEndISO, dayStartISO, toTehranDay } from "../../../utils/tehranDate";

// بدون حرف و عددهای شبیه هم (O/0 و I/1) تا موقع گفتن کد به مشتری اشتباه نشه
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateCouponCode = (length = 8) => {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("");
};

export const emptyCouponForm = () => ({
  code: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscountAmount: "",
  minCartAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  isActive: true,
});

const dayOf = (iso) => (iso ? toTehranDay(new Date(iso)) : "");

export const couponToForm = (c) => ({
  code: c.code,
  discountType: c.discountType,
  discountValue: String(c.discountValue),
  maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
  minCartAmount: c.minCartAmount ? String(c.minCartAmount) : "",
  startsAt: dayOf(c.startsAt),
  expiresAt: dayOf(c.expiresAt),
  usageLimit: c.usageLimit ? String(c.usageLimit) : "",
  isActive: c.isActive,
});

const filled = (value) => value.trim() !== "";

export const validateCouponForm = (form, { usedCount = 0 } = {}) => {
  const errors = {};

  if (!/^[A-Za-z0-9]{3,20}$/.test(form.code.trim())) {
    errors.code = "کد باید ۳ تا ۲۰ حرف یا عدد انگلیسی باشد";
  }

  const value = toNumber(form.discountValue);
  if (Number.isNaN(value) || value <= 0) {
    errors.discountValue = "مقدار تخفیف را به‌صورت عدد صحیح و بزرگ‌تر از صفر وارد کنید";
  } else if (form.discountType === "percentage" && value > 100) {
    errors.discountValue = "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد";
  } else if (value > 1_000_000_000) {
    errors.discountValue = "مقدار تخفیف بیش از حد مجاز است";
  }

  if (form.discountType === "percentage" && filled(form.maxDiscountAmount)) {
    const max = toNumber(form.maxDiscountAmount);
    if (Number.isNaN(max) || max <= 0) errors.maxDiscountAmount = "سقف تخفیف را به‌صورت عدد صحیح و بزرگ‌تر از صفر وارد کنید";
  }

  if (filled(form.minCartAmount) && Number.isNaN(toNumber(form.minCartAmount))) {
    errors.minCartAmount = "حداقل مبلغ سبد را به‌صورت عدد صحیح وارد کنید";
  }

  if (filled(form.usageLimit)) {
    const limit = toNumber(form.usageLimit);
    if (Number.isNaN(limit) || limit < 1) errors.usageLimit = "سقف استفاده باید عددی صحیح و حداقل ۱ باشد";
    else if (limit > 1_000_000) errors.usageLimit = "سقف استفاده بیش از حد مجاز است";
    else if (limit < usedCount) errors.usageLimit = `این کد قبلاً ${usedCount} بار استفاده شده؛ سقف نمی‌تواند کمتر از آن باشد`;
  }

  if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) {
    errors.expiresAt = "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد";
  }

  return errors;
};

export const formToCouponPayload = (form) => ({
  code: form.code.trim().toUpperCase(),
  discountType: form.discountType,
  discountValue: toNumber(form.discountValue),
  maxDiscountAmount:
    form.discountType === "percentage" && filled(form.maxDiscountAmount) ? toNumber(form.maxDiscountAmount) : null,
  minCartAmount: filled(form.minCartAmount) ? toNumber(form.minCartAmount) : 0,
  startsAt: form.startsAt ? dayStartISO(form.startsAt) : null,
  expiresAt: form.expiresAt ? dayEndISO(form.expiresAt) : null,
  usageLimit: filled(form.usageLimit) ? toNumber(form.usageLimit) : null,
  isActive: form.isActive,
});

// همان فرمول بکند (calculateDiscount) برای پیش‌نمایش
export const previewDiscount = (form, cartTotal) => {
  const value = toNumber(form.discountValue);
  if (Number.isNaN(value) || value <= 0) return null;

  if (form.discountType === "fixed") return Math.min(value, cartTotal);

  let discount = (cartTotal * Math.min(value, 100)) / 100;
  const max = filled(form.maxDiscountAmount) ? toNumber(form.maxDiscountAmount) : NaN;
  if (!Number.isNaN(max) && max > 0) discount = Math.min(discount, max);

  return Math.round(discount);
};