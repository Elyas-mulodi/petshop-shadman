export const minPriceOf = (p) => p.priceRange?.min ?? p.variants?.[0]?.price ?? 0;
export const maxPriceOf = (p) => p.priceRange?.max ?? p.variants?.[0]?.price ?? 0;

export const finalOf = (price, percent) => Math.round(price - (price * percent) / 100);

export const maxSaving = (p) => maxPriceOf(p) - finalOf(maxPriceOf(p), p.discountPercent);

export const endMs = (p) => (p.discountEndDate ? new Date(p.discountEndDate).getTime() : Infinity);
export const startMs = (p) => (p.discountStartDate ? new Date(p.discountStartDate).getTime() : null);

export const isLive = (p, now) => endMs(p) > now;
export const inStock = (p) => p.variants.some((v) => v.stock > 0);

const compare = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

export const SORTERS = {
  percent: (a, b) => b.discountPercent - a.discountPercent || maxSaving(b) - maxSaving(a),
  saving: (a, b) => maxSaving(b) - maxSaving(a),
  cheapest: (a, b) => finalOf(minPriceOf(a), a.discountPercent) - finalOf(minPriceOf(b), b.discountPercent),
  ending: (a, b) => compare(endMs(a), endMs(b)),
};