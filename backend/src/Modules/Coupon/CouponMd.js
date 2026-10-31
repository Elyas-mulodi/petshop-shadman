import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "کد تخفیف الزامی است"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "نوع تخفیف الزامی است"],
    },
    discountValue: {
      type: Number,
      required: [true, "مقدار تخفیف الزامی است"],
      min: [0, "مقدار تخفیف نمی‌تواند منفی باشد"],
    },
    maxDiscountAmount: { type: Number, default: null },
    minCartAmount: { type: Number, default: 0 },
    startsAt: { type: Date, default: null }, // قبل از این تاریخ قابل استفاده نیست
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, min: 1, default: null }, // سقف تعداد کل استفاده (خالی = نامحدود)
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.index({ isActive: 1, createdAt: -1 });

couponSchema.methods.calculateDiscount = function (cartTotal) {
  if (this.discountType === "fixed") {
    return Math.min(this.discountValue, cartTotal);
  }

  let discount = (cartTotal * this.discountValue) / 100;
  if (this.maxDiscountAmount) {
    discount = Math.min(discount, this.maxDiscountAmount);
  }
  return Math.round(discount);
};

// وضعیت: disabled | scheduled | expired | exhausted | active
couponSchema.methods.getStatus = function (now = new Date()) {
  if (!this.isActive) return "disabled";
  if (this.startsAt && now < this.startsAt) return "scheduled";
  if (this.expiresAt && now > this.expiresAt) return "expired";
  if (this.usageLimit && this.usedBy.length >= this.usageLimit)
    return "exhausted";
  return "active";
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
