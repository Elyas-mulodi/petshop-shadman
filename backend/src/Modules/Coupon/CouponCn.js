import asyncHandler from "express-async-handler";
import Coupon from "./CouponMd.js";
import Cart from "../Cart/CartMd.js";
import Order from "../Order/OrderMd.js";
import { buildCartResponse } from "../../Utils/cartHelper.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];
const STATUS_KEYS = ["active", "scheduled", "expired", "exhausted", "disabled"];

const started = (now) => ({
  $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
});
const notExpired = (now) => ({
  $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
});
const hasCapacity = {
  $or: [
    { usageLimit: null },
    { $expr: { $lt: [{ $size: "$usedBy" }, "$usageLimit"] } },
  ],
};
const isFull = {
  usageLimit: { $ne: null },
  $expr: { $gte: [{ $size: "$usedBy" }, "$usageLimit"] },
};

// فیلتر هر وضعیت، دقیقاً با همون اولویتِ getStatus
const statusFilter = (status, now) => {
  switch (status) {
    case "disabled":
      return { isActive: false };
    case "scheduled":
      return { isActive: true, startsAt: { $gt: now } };
    case "expired":
      return {
        isActive: true,
        $and: [started(now), { expiresAt: { $lt: now } }],
      };
    case "exhausted":
      return { isActive: true, $and: [started(now), notExpired(now), isFull] };
    case "active":
      return {
        isActive: true,
        $and: [started(now), notExpired(now), hasCapacity],
      };
    default:
      return {};
  }
};

const statusOf = (coupon, now) => {
  if (!coupon.isActive) return "disabled";
  if (coupon.startsAt && now < coupon.startsAt) return "scheduled";
  if (coupon.expiresAt && now > coupon.expiresAt) return "expired";
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return "exhausted";
  return "active";
};

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

// ---------- لیست کدها با وضعیت، تعداد استفاده و آمار فروش (ادمین) ----------
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const now = new Date();

  const filter = statusFilter(req.query.status, now);
  if (req.query.search)
    filter.code = new RegExp(escapeRegex(req.query.search.toUpperCase()), "i");

  const [rows, total] = await Promise.all([
    Coupon.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $addFields: { usedCount: { $size: "$usedBy" } } },
      { $project: { usedBy: 0 } },
    ]),
    Coupon.countDocuments(filter),
  ]);

  const stats = rows.length
    ? await Order.aggregate([
        {
          $match: {
            couponCode: { $in: rows.map((c) => c.code) },
            status: { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: "$couponCode",
            orders: { $sum: 1 },
            discount: { $sum: "$discountAmount" },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ])
    : [];
  const statsByCode = new Map(stats.map((s) => [s._id, s]));

  res.status(200).json({
    success: true,
    data: rows.map((c) => ({
      ...c,
      status: statusOf(c, now),
      stats: {
        orders: statsByCode.get(c.code)?.orders ?? 0,
        discount: statsByCode.get(c.code)?.discount ?? 0,
        revenue: statsByCode.get(c.code)?.revenue ?? 0,
      },
    })),
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// ---------- شمارنده‌ی هر وضعیت ----------
export const getCouponCounts = asyncHandler(async (req, res) => {
  const now = new Date();

  const [all, ...counts] = await Promise.all([
    Coupon.countDocuments(),
    ...STATUS_KEYS.map((key) => Coupon.countDocuments(statusFilter(key, now))),
  ]);

  res.status(200).json({
    success: true,
    data: {
      all,
      ...Object.fromEntries(STATUS_KEYS.map((key, i) => [key, counts[i]])),
    },
  });
});

// ---------- ویرایش کد تخفیف (ادمین): فقط فیلدهای مجاز؛ usedBy دست‌نخورده می‌مونه ----------
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
    startsAt,
    expiresAt,
    usageLimit,
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
  if (startsAt !== undefined) coupon.startsAt = startsAt;
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
  if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
  if (isActive !== undefined) coupon.isActive = isActive;

  // بررسی نهایی روی مقادیر ترکیب‌شده
  if (coupon.discountType === "percentage" && coupon.discountValue > 100) {
    res.status(400);
    throw new Error("مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد");
  }

  if (
    coupon.startsAt &&
    coupon.expiresAt &&
    coupon.expiresAt < coupon.startsAt
  ) {
    res.status(400);
    throw new Error("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد");
  }

  if (coupon.usageLimit && coupon.usageLimit < coupon.usedBy.length) {
    res.status(400);
    throw new Error(
      `این کد قبلاً ${coupon.usedBy.length} بار استفاده شده؛ سقف نمی‌تواند کمتر از آن باشد`,
    );
  }

  await coupon.save();

  res.status(200).json({ success: true, data: coupon });
});

// ---------- حذف کد تخفیف (ادمین): کدی که استفاده شده فقط غیرفعال می‌شه تا سابقه بمونه ----------
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error("کد تخفیف یافت نشد");
  }

  if (coupon.usedBy.length > 0) {
    res.status(409);
    throw new Error(
      "این کد قبلاً استفاده شده و حذف نمی‌شود؛ آن را غیرفعال کنید",
    );
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
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) return { valid: false, message: "کد تخفیف نامعتبر است" };

  const status = coupon.getStatus();
  if (status === "disabled")
    return { valid: false, message: "کد تخفیف نامعتبر است" };
  if (status === "scheduled")
    return { valid: false, message: "این کد تخفیف هنوز فعال نشده است" };
  if (status === "expired")
    return { valid: false, message: "این کد تخفیف منقضی شده است" };
  if (status === "exhausted")
    return {
      valid: false,
      message: "ظرفیت استفاده از این کد تخفیف تکمیل شده است",
    };

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
