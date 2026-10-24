import asyncHandler from "express-async-handler";
import Coupon from "./CouponMd.js";
import Cart from "../Cart/CartMd.js";
import { buildCartResponse } from "../../Utils/cartHelper.js";

// ---------- ساخت کد تخفیف (ادمین) ----------
export const createCoupon = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });

  if (existing) {
    res.status(409);
    throw new Error("این کد تخفیف قبلاً ساخته شده است");
  }

  const coupon = await Coupon.create(req.body);

  res.status(201).json({ success: true, data: coupon });
});

// ---------- لیست همه کدها (ادمین) ----------
export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
});

// ---------- ویرایش کد تخفیف (ادمین) ----------
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("کد تخفیف یافت نشد");
  }

  const {
    code,
    discountType,
    discountValue,
    maxDiscountAmount,
    minCartAmount,
    expiresAt,
    isActive,
  } = req.body;

  if (code !== undefined && code.toUpperCase() !== coupon.code) {
    const duplicate = await Coupon.exists({
      code: code.toUpperCase(),
      _id: { $ne: coupon._id },
    });
    if (duplicate) {
      res.status(409);
      throw new Error("این کد تخفیف قبلاً ساخته شده است");
    }
    coupon.code = code;
  }

  if (discountType !== undefined) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (maxDiscountAmount !== undefined)
    coupon.maxDiscountAmount = maxDiscountAmount;
  if (minCartAmount !== undefined) coupon.minCartAmount = minCartAmount;
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
  if (isActive !== undefined) coupon.isActive = isActive;

  // بررسی نهایی روی مقادیر ترکیب‌شده (مثلاً فقط نوع به درصد عوض شده ولی مقدار قبلی ثابت مونده)
  if (coupon.discountType === "percentage" && coupon.discountValue > 100) {
    res.status(400);
    throw new Error("مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد");
  }

  await coupon.save();

  res.status(200).json({ success: true, data: coupon });
});

// ---------- حذف کد تخفیف (ادمین) ----------
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("کد تخفیف یافت نشد");
  }

  await coupon.deleteOne();
  res.status(200).json({ success: true, message: "کد تخفیف حذف شد" });
});

// ---------- بررسی اعتبار و محاسبه تخفیف کد (کاربر، هنگام پرداخت) ----------
// نکته: این تابع فقط اعتبارسنجی و محاسبه می‌کنه، ثبت استفاده (usedBy) موقع نهایی شدن سفارش انجام میشه
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("سبد خرید شما خالی است");
  }

  const { subtotal } = await buildCartResponse(cart);

  const result = await validateCouponForUser(code, req.user._id, subtotal);

  if (!result.valid) {
    res.status(400);
    throw new Error(result.message);
  }

  res.status(200).json({
    success: true,
    data: {
      code: result.coupon.code,
      discountAmount: result.discountAmount,
      couponId: result.coupon._id,
    },
  });
});

// ---------- تابع کمکی داخلی (نه route) — موقع ثبت نهایی سفارش توسط ماژول Order فراخوانی میشه ----------
export const markCouponAsUsed = async (couponId, userId) => {
  await Coupon.findByIdAndUpdate(couponId, { $addToSet: { usedBy: userId } });
};

// ---------- تابع مشترک اعتبارسنجی کد تخفیف (برای استفاده در route و OrderCn) ----------
export const validateCouponForUser = async (code, userId, cartTotal) => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) return { valid: false, message: "کد تخفیف نامعتبر است" };
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { valid: false, message: "این کد تخفیف منقضی شده است" };
  if (coupon.usedBy.some((id) => String(id) === String(userId)))
    return {
      valid: false,
      message: "شما قبلاً از این کد تخفیف استفاده کرده‌اید",
    };
  if (cartTotal < coupon.minCartAmount)
    return {
      valid: false,
      message: `حداقل مبلغ سبد برای این کد ${coupon.minCartAmount.toLocaleString()} تومان است`,
    };

  const discountAmount = coupon.calculateDiscount(cartTotal);
  return { valid: true, discountAmount, coupon };
};
