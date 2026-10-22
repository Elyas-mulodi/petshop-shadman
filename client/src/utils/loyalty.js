export const LOYALTY_VALID_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export const getActiveLoyalty = (user) => {
  const pending = user?.pendingLoyaltyDiscount;
  if (!pending || !(pending.percent > 0) || !pending.expiresAt) return null;

  const remaining = new Date(pending.expiresAt).getTime() - Date.now();
  if (remaining <= 0) return null;

  return {
    percent: pending.percent,
    expiresAt: pending.expiresAt,
    daysLeft: Math.ceil(remaining / DAY_MS),
    ratio: Math.min(1, remaining / (LOYALTY_VALID_DAYS * DAY_MS)),
  };
};