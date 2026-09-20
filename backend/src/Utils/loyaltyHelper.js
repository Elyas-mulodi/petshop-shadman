import LoyaltyTier from "../Modules/LoyaltyTier/LoyaltyTierMd.js";

export const calculateLoyaltyPercent = async (orderAmount) => {
  const tiers = await LoyaltyTier.find({
    isActive: true,
    minOrderAmount: { $lte: orderAmount },
  }).sort({ minOrderAmount: -1 });

  return tiers.length > 0 ? tiers[0].discountPercent : 0;
};

export const grantLoyaltyDiscount = async (user, orderAmount) => {
  const percent = await calculateLoyaltyPercent(orderAmount);

  if (percent > 0) {
    user.pendingLoyaltyDiscount = {
      percent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    await user.save();
  }
};