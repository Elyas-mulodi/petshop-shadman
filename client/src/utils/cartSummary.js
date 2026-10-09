export const buildCartSummary = ({ subtotal, shippingConfig, loyalty }) => {
  const loyaltyActive =
    loyalty &&
    loyalty.percent > 0 &&
    loyalty.expiresAt &&
    new Date(loyalty.expiresAt).getTime() > Date.now();

  const discountPercent = loyaltyActive ? loyalty.percent : 0;
  const discount = Math.round((subtotal * discountPercent) / 100);

  const threshold = shippingConfig?.freeShippingThreshold ?? 0;
  // null یعنی تنظیمات ارسال هنوز نیومده یا خطا داده
  const shipping = shippingConfig ? (subtotal >= threshold ? 0 : shippingConfig.shippingCost) : null;

  return {
    subtotal,
    discount,
    discountPercent,
    shipping,
    threshold,
    total: subtotal - discount + (shipping ?? 0),
    freeShippingRemaining: shipping > 0 && threshold > 0 ? threshold - subtotal : 0,
  };
};