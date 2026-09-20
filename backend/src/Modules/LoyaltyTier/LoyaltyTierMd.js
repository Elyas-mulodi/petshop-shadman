import mongoose from "mongoose";

const loyaltyTierSchema = new mongoose.Schema(
  {
    minOrderAmount: {
      type: Number,
      required: [true, "حداقل مبلغ سفارش الزامی است"],
      min: 0,
    },
    discountPercent: {
      type: Number,
      required: [true, "درصد تخفیف الزامی است"],
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const LoyaltyTier = mongoose.model("LoyaltyTier", loyaltyTierSchema);
export default LoyaltyTier;