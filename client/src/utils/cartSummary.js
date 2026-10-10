export const buildCartSummary = ({ subtotal, shippingConfig, loyalty, coupon }) => {
  const loyaltyActive =
    loyalty &&
    loyalty.percent > 0 &&
    loyalty.expiresAt &&
    new Date(loyalty.expiresAt).getTime() > Date.now();

  const useCoupon = Boolean(coupon && coupon.discountAmount > 0);

  const discountPercent = !useCoupon && loyaltyActive ? loyalty.percent : 0;
  const discount = useCoupon
    ? Math.min(coupon.discountAmount, subtotal)
    : Math.round((subtotal * discountPercent) / 100);

  const threshold = shippingConfig?.freeShippingThreshold ?? 0;
  // null یعنی تنظیمات ارسال هنوز نیومده یا خطا داده
  const shipping = shippingConfig ? (subtotal >= threshold ? 0 : shippingConfig.shippingCost) : null;

  return {
    subtotal,
    discount,
    discountPercent,
    discountSource: useCoupon ? "coupon" : discount > 0 ? "loyalty" : null,
    couponCode: useCoupon ? coupon.code : null,
    shipping,
    threshold,
    total: subtotal - discount + (shipping ?? 0),
    freeShippingRemaining: shipping > 0 && threshold > 0 ? threshold - subtotal : 0,
  };
};