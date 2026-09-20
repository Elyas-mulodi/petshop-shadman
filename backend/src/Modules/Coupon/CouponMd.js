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
    maxDiscountAmount: {
      type: Number,
      default: null, 
    },
    minCartAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null, 
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

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

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;