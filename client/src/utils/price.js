import { toPersianDigits } from "./authHelpers";

export const formatToman = (amount) => `${toPersianDigits(amount.toLocaleString("en-US"))} تومان`;

// کمترین قیمت بین واریانت‌ها + قیمت بعد از تخفیف (اگه تخفیف فعال باشه)
export const getProductPricing = (product) => {
  const basePrice = product.priceRange?.min ?? product.variants?.[0]?.price ?? 0;
  const hasDiscount = product.discountPercent > 0;
  const finalPrice = hasDiscount
    ? Math.round(basePrice - (basePrice * product.discountPercent) / 100)
    : basePrice;

  return { basePrice, finalPrice, hasDiscount, discountPercent: product.discountPercent };
};