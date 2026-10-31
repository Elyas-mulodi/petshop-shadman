import asyncHandler from "express-async-handler";
import LoyaltyTier from "./LoyaltyTierMd.js";

const duplicateMessage = "برای این مبلغ قبلاً پله‌ای تعریف شده است";

export const createLoyaltyTier = asyncHandler(async (req, res) => {
  const { minOrderAmount, discountPercent, isActive } = req.body;

  if (await LoyaltyTier.exists({ minOrderAmount })) {
    res.status(409);
    throw new Error(duplicateMessage);
  }

  const tier = await LoyaltyTier.create({
    minOrderAmount,
    discountPercent,
    isActive: isActive ?? true,
  });
  res.status(201).json({ success: true, data: tier });
});

export const getAllLoyaltyTiers = asyncHandler(async (req, res) => {
  const tiers = await LoyaltyTier.find().sort({ minOrderAmount: 1 });
  res.status(200).json({ success: true, data: tiers });
});

// ---------- عمومی: پله‌های فعال برای صفحه‌ی پروفایل مشتری ----------
export const getPublicLoyaltyTiers = asyncHandler(async (req, res) => {
  const tiers = await LoyaltyTier.find({ isActive: true })
    .select("minOrderAmount discountPercent")
    .sort({ minOrderAmount: 1 });
  res.status(200).json({ success: true, data: tiers });
});

export const updateLoyaltyTier = asyncHandler(async (req, res) => {
  const tier = await LoyaltyTier.findById(req.params.id);

  if (!tier) {
    res.status(404);
    throw new Error("سطح پلکانی یافت نشد");
  }

  const { minOrderAmount, discountPercent, isActive } = req.body;

  if (minOrderAmount !== undefined && minOrderAmount !== tier.minOrderAmount) {
    if (await LoyaltyTier.exists({ minOrderAmount, _id: { $ne: tier._id } })) {
      res.status(409);
      throw new Error(duplicateMessage);
    }
    tier.minOrderAmount = minOrderAmount;
  }

  if (discountPercent !== undefined) tier.discountPercent = discountPercent;
  if (isActive !== undefined) tier.isActive = isActive;

  await tier.save();

  res.status(200).json({ success: true, data: tier });
});

export const deleteLoyaltyTier = asyncHandler(async (req, res) => {
  const tier = await LoyaltyTier.findById(req.params.id);

  if (!tier) {
    res.status(404);
    throw new Error("سطح پلکانی یافت نشد");
  }

  await tier.deleteOne();
  res.status(200).json({ success: true, message: "سطح پلکانی حذف شد" });
});
