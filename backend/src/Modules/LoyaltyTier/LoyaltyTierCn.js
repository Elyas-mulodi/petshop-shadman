import asyncHandler from "express-async-handler";
import LoyaltyTier from "./LoyaltyTierMd.js";

export const createLoyaltyTier = asyncHandler(async (req, res) => {
  const tier = await LoyaltyTier.create(req.body);
  res.status(201).json({ success: true, data: tier });
});

export const getAllLoyaltyTiers = asyncHandler(async (req, res) => {
  const tiers = await LoyaltyTier.find().sort({ minOrderAmount: 1 });
  res.status(200).json({ success: true, data: tiers });
});

export const updateLoyaltyTier = asyncHandler(async (req, res) => {
  const tier = await LoyaltyTier.findById(req.params.id);

  if (!tier) {
    res.status(404);
    throw new Error("سطح پلکانی یافت نشد");
  }

  Object.assign(tier, req.body);
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

export const getPublicLoyaltyTiers = asyncHandler(async (req, res) => {
  const tiers = await LoyaltyTier.find({ isActive: true })
    .select("minOrderAmount discountPercent")
    .sort({ minOrderAmount: 1 });
  res.status(200).json({ success: true, data: tiers });
});