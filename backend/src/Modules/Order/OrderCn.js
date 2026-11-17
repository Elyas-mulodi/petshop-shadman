import asyncHandler from "express-async-handler";
import Cart from "../Cart/CartMd.js";
import Product from "../Product/ProductMd.js";
import User from "../User/UserMd.js";
import {
  buildCartResponse,
  findProductAndVariant,
} from "../../Utils/cartHelper.js";
import { validateCouponForUser, markCouponAsUsed } from "../Coupon/CouponCn.js";
import { grantLoyaltyDiscount } from "../../Utils/loyaltyHelper.js";
import { requestPayment, verifyPayment } from "../../Utils/zarinpal.js";
import generateOrderNumber from "../../Utils/generateOrderNumber.js";
import sendSms from "../../Utils/sendSms.js";
import {
  orderConfirmedSms,
  orderShippedSms,
  orderDeliveredSms,
} from "../../Utils/orderSmsTemplates.js";
import Order, { ORDER_HOLD_MS } from "./OrderMd.js";

import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";
import {
  buildDateFilter,
  formatJalali,
  toTehranDay,
} from "../../Utils/dateRange.js";
import { csvRow } from "../../Utils/csv.js";
import { getSettings } from "../../Utils/settings.js";
import { logAudit } from "../../Utils/audit.js";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];

const STATUS_LABELS = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
  expired: "منقضی شده",
};

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  totalDesc: { totalAmount: -1, _id: -1 },
  totalAsc: { totalAmount: 1, _id: 1 },
};

const EXPORT_LIMIT = 5000;
const historyEntry = (status, by = null) => ({ status, at: new Date(), by });
const PAYABLE_STATUSES = ["pending_payment", "expired"];
const LOCK_MS = 60 * 1000;
const lockIsFree = (now) => [
  { "payment.verifyLockUntil": null },
  { "payment.verifyLockUntil": { $lt: now } },
];

const getShippingCost = async (subtotal) => {
  const { cost, freeThreshold } = (await getSettings()).shipping;
  return freeThreshold > 0 && subtotal >= freeThreshold ? 0 : cost;
};

export const getShippingConfig = asyncHandler(async (req, res) => {
  const { cost, freeThreshold } = (await getSettings()).shipping;

  res.status(200).json({
    success: true,
    data: { shippingCost: cost, freeShippingThreshold: freeThreshold },
  });
});

// ---------- ساخت سفارش از روی سبد خرید + شروع پرداخت ----------
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("سبد خرید شما خالی است");
  }

  const cartResult = await buildCartResponse(cart);

  if (cartResult.hadInvalidItems) {
    res.status(400);
    throw new Error(
      "برخی از محصولات سبد شما دیگر موجود نیستند، لطفاً سبد خرید را بررسی کنید",
    );
  }

  const subtotal = cartResult.subtotal;

  // ---------- محاسبه تخفیف: یا کد تخفیف یا loyalty (نه هر دو) ----------
  let discountAmount = 0;
  let discountSource = null;
  let appliedCoupon = null;

  if (couponCode) {
    const result = await validateCouponForUser(
      couponCode,
      req.user._id,
      subtotal,
    );
    if (!result.valid) {
      res.status(400);
      throw new Error(result.message);
    }
    discountAmount = result.discountAmount;
    discountSource = "coupon";
    appliedCoupon = result.coupon;
  } else {
    const user = await User.findById(req.user._id);
    const pending = user.pendingLoyaltyDiscount;
    if (
      pending &&
      pending.percent > 0 &&
      pending.expiresAt &&
      pending.expiresAt > new Date()
    ) {
      discountAmount = Math.round((subtotal * pending.percent) / 100);
      discountSource = "loyalty";
    }
  }

  const shippingCost = await getShippingCost(subtotal);
  const totalAmount = subtotal - discountAmount + shippingCost;

  // تخفیف (کد یا وفاداری) نباید هم‌زمان روی دو سفارش پرداخت‌نشده بنشینه
  if (discountSource) {
    const stale = {
      user: req.user._id,
      status: "pending_payment",
      discountSource,
    };
    if (discountSource === "coupon") stale.couponId = appliedCoupon._id;

    await Order.updateMany(stale, {
      $set: { status: "cancelled" },
      $push: { statusHistory: historyEntry("cancelled") },
    });
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items: cartResult.items.map((item) => ({
      product: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      attributes: item.attributes,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.finalPrice,
      lineTotal: item.lineTotal,
    })),
    shippingAddress,
    subtotal,
    shippingCost,
    discountAmount,
    discountSource,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    couponId: appliedCoupon ? appliedCoupon._id : null,
    totalAmount,
    statusHistory: [historyEntry("pending_payment")],
  });
  await User.updateOne(
    { _id: req.user._id, $or: [{ name: null }, { name: "" }] },
    { $set: { name: shippingAddress.fullName.slice(0, 50) } },
  );
  // ---------- شروع پرداخت با زرین‌پال ----------
  const payment = await requestPayment({
    amountToman: totalAmount,
    description: `پرداخت سفارش ${order.orderNumber} - فاکسی پت`,
    mobile: req.user.phone,
  });

  if (!payment.success) {
    // سفارشی که درگاهش ساخته نشد نباید معلق بمونه
    order.status = "cancelled";
    order.statusHistory.push(historyEntry("cancelled"));
    await order.save();

    res.status(502);
    throw new Error(payment.error);
  }

  order.payment.authority = payment.authority;
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentUrl: payment.paymentUrl,
    },
  });
}); // پایان تابع createOrder

// ---------- بازگشت از درگاه و تایید پرداخت ----------
export const verifyOrderPayment = asyncHandler(async (req, res) => {
  const { Authority, Status } = req.query;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resultUrl = `${clientUrl}/checkout/result`;

  const finish = (status, order) =>
    res.redirect(
      `${resultUrl}?status=${status}${order ? `&order=${order.orderNumber}` : ""}`,
    );

  if (!Authority || typeof Authority !== "string") {
    console.warn("verify: Authority نامعتبر");
    return finish("not-found");
  }

  const order = await Order.findOne({ "payment.authority": Authority });

  if (!order) {
    console.warn(`verify: سفارشی با این Authority پیدا نشد (${Authority})`);
    return finish("not-found");
  }

  if (!PAYABLE_STATUSES.includes(order.status)) {
    console.info(
      `verify: سفارش ${order.orderNumber} قبلاً پردازش شده (وضعیت: ${order.status})`,
    );
    return finish("already-processed", order);
  }

  if (Status !== "OK") {
    console.info(
      `verify: پرداخت سفارش ${order.orderNumber} ناموفق یا لغو شد (Status=${Status})`,
    );
    return finish("failed", order);
  }

  // تایید دوباره‌ی همین تراکنش بی‌خطره (کد ۱۰۱ هم موفق حساب می‌شه)، پس قفل لازم نیست
  let verifyResult;
  try {
    verifyResult = await verifyPayment({
      authority: Authority,
      amountToman: order.totalAmount,
    });
  } catch (err) {
    console.error(`verify: خطای غیرمنتظره در تایید ${order.orderNumber}:`, err);
    return finish("failed", order);
  }

  if (!verifyResult.success) {
    console.error(
      `verify: درگاه پرداخت سفارش ${order.orderNumber} را تایید نکرد: ${verifyResult.error}`,
    );
    return finish("failed", order);
  }

  // انتقال اتمیک به paid؛ اگه دو درخواست هم‌زمان بیان فقط یکی برنده می‌شه
  const paid = await Order.findOneAndUpdate(
    { _id: order._id, status: { $in: PAYABLE_STATUSES } },
    {
      $set: {
        status: "paid",
        "payment.refId": verifyResult.refId,
        "payment.paidAt": new Date(),
      },
      $push: { statusHistory: historyEntry("paid") },
    },
    { new: true },
  );

  if (!paid) {
    const current = await Order.findById(order._id).select("status");

    // درخواست هم‌زمان دیگه‌ای همین پرداخت رو ثبت کرده
    if (current && REVENUE_STATUSES.includes(current.status))
      return finish("already-processed", order);

    // پول گرفته شده ولی سفارش دیگه قابل پرداخت نیست (مثلاً در همین فاصله لغو شده): برای عودت وجه ثبت می‌شه
    await Order.updateOne(
      { _id: order._id, "payment.refId": null },
      {
        $set: {
          "payment.refId": verifyResult.refId,
          "payment.paidAt": new Date(),
          "refund.required": true,
        },
      },
    );
    console.error(
      `verify: پرداخت ${verifyResult.refId} برای سفارش ${order.orderNumber} با وضعیت «${current?.status}» رسید؛ نیاز به عودت وجه`,
    );
    return finish("failed", order);
  }

  // از اینجا به بعد پول گرفته شده؛ هیچ خطایی نباید مانع رسیدن مشتری به صفحه‌ی موفقیت بشه
  let oversold = false;
  try {
    for (const item of paid.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -item.quantity } },
        { new: true },
      );
      const variant = updated?.variants.id(item.variantId);
      if (!variant || variant.stock < 0) oversold = true;
    }
    await Order.updateOne(
      { _id: paid._id },
      { $set: { stockDeducted: true, stockIssue: oversold } },
    );
  } catch (err) {
    console.error(
      `verify: خطا در کم‌کردن موجودی سفارش ${paid.orderNumber}:`,
      err,
    );
    await Order.updateOne(
      { _id: paid._id },
      { $set: { stockIssue: true } },
    ).catch(() => {});
  }

  const safe = async (label, task) => {
    try {
      await task();
    } catch (err) {
      console.error(`❌ ${label} failed for order ${paid.orderNumber}:`, err);
    }
  };

  const user = await User.findById(paid.user);

  await safe("consume discount", async () => {
    if (paid.discountSource === "coupon" && paid.couponId) {
      await markCouponAsUsed(paid.couponId, paid.user);
    } else if (paid.discountSource === "loyalty" && user) {
      user.pendingLoyaltyDiscount = { percent: 0, expiresAt: null };
      await user.save();
    }
  });

  await safe("grant loyalty", async () => {
    if (user) await grantLoyaltyDiscount(user, paid.subtotal);
  });

  await safe("clear cart", () =>
    Cart.updateOne(
      { user: paid.user },
      {
        $pull: {
          items: { variantId: { $in: paid.items.map((i) => i.variantId) } },
        },
      },
    ),
  );

  if (user) {
    sendSms(
      user.phone,
      orderConfirmedSms(paid.orderNumber, paid.totalAmount),
    ).catch((err) =>
      console.error("خطا در ارسال پیامک تایید سفارش:", err.message),
    );
  }

  return finish("success", paid);
});

// ---------- سفارش‌های کاربر ----------
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    status: { $ne: "expired" },
    // سفارشی که مهلتش تموم شده ولی جاب هنوز منقضیش نکرده
    $nor: [{ status: "pending_payment", expiresAt: { $lt: new Date() } }],
  })
    .select("-payment.authority -payment.verifyLockUntil")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: orders });
});

// ---------- پرداخت مجدد یک سفارش پرداخت‌نشده (کاربر) ----------
export const retryOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  if (order.status !== "pending_payment") {
    res.status(400);
    throw new Error("این سفارش در انتظار پرداخت نیست");
  }

  if (order.expiresAt && order.expiresAt < new Date()) {
    res.status(400);
    throw new Error("مهلت پرداخت این سفارش تمام شده است. سفارش جدید ثبت کنید");
  }

  // موجودی فقط بعد از پرداخت کسر می‌شه، پس قبل از پرداخت دوباره باید چک بشه
  for (const item of order.items) {
    const { variant, error } = await findProductAndVariant(
      item.product,
      item.variantId,
    );

    if (error || variant.stock < item.quantity) {
      res.status(400);
      throw new Error(
        `«${item.productName}» دیگر به تعداد درخواستی موجود نیست. سفارش را لغو و دوباره ثبت کنید`,
      );
    }
  }

  // تخفیف سفارش نباید بین زمان ثبت و پرداخت مجدد باطل یا مصرف شده باشه
  const discountInvalidMessage =
    "تخفیف اعمال‌شده روی این سفارش دیگر معتبر نیست. سفارش را لغو و دوباره ثبت کنید";

  if (order.discountSource === "coupon") {
    const result = await validateCouponForUser(
      order.couponCode,
      order.user,
      order.subtotal,
    );
    if (!result.valid) {
      res.status(400);
      throw new Error(discountInvalidMessage);
    }
  } else if (order.discountSource === "loyalty") {
    const pending = req.user.pendingLoyaltyDiscount;
    const stillValid =
      pending &&
      pending.percent > 0 &&
      pending.expiresAt &&
      pending.expiresAt > new Date();
    if (!stillValid) {
      res.status(400);
      throw new Error(discountInvalidMessage);
    }
  }

  const payment = await requestPayment({
    amountToman: order.totalAmount,
    description: `پرداخت سفارش ${order.orderNumber} - فاکسی پت`,
    mobile: req.user.phone,
  });

  if (!payment.success) {
    res.status(502);
    throw new Error(payment.error);
  }

  order.payment.authority = payment.authority;
  order.payment.verifyLockUntil = null;
  order.expiresAt = new Date(Date.now() + ORDER_HOLD_MS);
  await order.save();

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentUrl: payment.paymentUrl,
    },
  });
});

// ---------- لغو سفارش پرداخت‌نشده توسط خود کاربر ----------
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      status: "pending_payment",
      $or: lockIsFree(new Date()),
    },
    {
      $set: { status: "cancelled" },
      $push: { statusHistory: historyEntry("cancelled", req.user._id) },
    },
    { new: true },
  );

  if (!order) {
    res.status(404);
    throw new Error(
      "سفارش پیدا نشد، دیگر قابل لغو نیست یا پرداخت آن در حال بررسی است",
    );
  }

  res
    .status(200)
    .json({ success: true, data: { _id: order._id, status: order.status } });
});

// ---------- جزئیات یک سفارش (کاربر فقط سفارش خودش، ادمین همه) ----------
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select(
    "-payment.authority -payment.verifyLockUntil",
  );
  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  if (
    req.user.role !== "admin" &&
    String(order.user) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error("شما اجازه دسترسی به این سفارش را ندارید");
  }

  res.status(200).json({ success: true, data: order });
});

// ---------- همه سفارش‌ها (ادمین) ----------
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = await buildOrderFilter(req.query);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(
        "orderNumber user status totalAmount discountAmount stockIssue createdAt payment.paidAt payment.refId refund shipping.trackingCode shippingAddress.fullName shippingAddress.phone shippingAddress.province items.productName items.quantity items.image",
      )
      .populate("user", "phone name")
      .sort(SORTS[req.query.sort] ?? SORTS.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// ---------- تغییر وضعیت سفارش (فقط ادمین) ----------
const ALLOWED_TRANSITIONS = {
  paid: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, carrier, trackingCode } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  if (order.status === "pending_payment") {
    res.status(400);
    throw new Error("سفارشی که هنوز پرداخت نشده قابل تغییر وضعیت نیست");
  }

  if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(status)) {
    res.status(400);
    throw new Error("این تغییر وضعیت برای سفارش مجاز نیست");
  }

  const isReversal = status === "cancelled" || status === "returned";
  const set = { status };

  if (status === "shipped") {
    set["shipping.shippedAt"] = new Date();
    if (carrier) set["shipping.carrier"] = carrier;
    if (trackingCode) set["shipping.trackingCode"] = trackingCode;
  }

  // سفارشی که پولش گرفته شده و لغو یا مرجوع می‌شه، باید عودت وجه بشه
  if (isReversal && order.payment?.refId) set["refund.required"] = true;

  // تغییر اتمیک: اگه ادمین دیگه‌ای هم‌زمان وضعیت رو عوض کرده باشه، این درخواست رد می‌شه
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: set, $push: { statusHistory: historyEntry(status, req.user._id) } },
    { new: true },
  );

  if (!updated) {
    res.status(409);
    throw new Error("وضعیت سفارش هم‌زمان تغییر کرد، صفحه را تازه کنید");
  }

  // برگشت موجودی فقط یک‌بار (اگه همزمان دو درخواست بیاد، فقط یکی claim می‌کنه)
  if (isReversal) {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, stockDeducted: true },
      { $set: { stockDeducted: false } },
    );

    if (claimed) {
      for (const item of updated.items) {
        await Product.updateOne(
          { _id: item.product, "variants._id": item.variantId },
          { $inc: { "variants.$.stock": item.quantity } },
        );
      }
    }
  }

  // پیامک تغییر وضعیت (بدون await؛ خطای پیامک نباید چیزی رو خراب کنه)
  const user = await User.findById(updated.user);

  if (user && status === "shipped") {
    sendSms(user.phone, orderShippedSms(updated.orderNumber)).catch((err) =>
      console.error("خطا در ارسال پیامک ارسال سفارش:", err.message),
    );
  } else if (user && status === "delivered") {
    sendSms(user.phone, orderDeliveredSms(updated.orderNumber)).catch((err) =>
      console.error("خطا در ارسال پیامک تحویل سفارش:", err.message),
    );
  }

  await logAudit(req, {
    action: "order.status",
    entityType: "order",
    entityId: updated._id,
    entityLabel: updated.orderNumber,
    summary: `وضعیت سفارش ${updated.orderNumber} از «${STATUS_LABELS[order.status]}» به «${STATUS_LABELS[status]}» تغییر کرد`,
    changes: [
      {
        field: "status",
        label: "وضعیت",
        from: STATUS_LABELS[order.status],
        to: STATUS_LABELS[status],
      },
    ],
  });
  res.status(200).json({
    success: true,
    data: updated,
    refundRequired: isReversal && !!updated.payment?.refId,
  });
});

const buildOrderFilter = async (query, { withStatus = true } = {}) => {
  const { status, search, from, to, stockIssue, refundPending } = query;
  const filter = {};

  // «همه» سفارش‌های منقضی‌شده (رهاشده) رو شامل نمی‌شه
  if (withStatus) filter.status = status ? status : { $ne: "expired" };
  if (stockIssue === "true") filter.stockIssue = true;
  if (refundPending === "true") {
    filter["refund.required"] = true;
    filter["refund.doneAt"] = null;
  }

  const dateRange = buildDateFilter(from, to);
  if (dateRange) filter.createdAt = dateRange;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const users = await User.find({ phone: rx }).select("_id").limit(50).lean();

    filter.$or = [
      { orderNumber: rx },
      { "shippingAddress.phone": rx },
      { "shippingAddress.fullName": rx },
      { "payment.refId": rx },
      { "shipping.trackingCode": rx },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  return filter;
};

export const getOrderCounts = asyncHandler(async (req, res) => {
  // شمارنده‌ی هر وضعیت با همه‌ی فیلترها به‌جز خود وضعیت
  const filter = await buildOrderFilter(req.query, { withStatus: false });

  const [rows, refundPending, stockIssue] = await Promise.all([
    Order.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ "refund.required": true, "refund.doneAt": null }),
    Order.countDocuments({
      stockIssue: true,
      status: { $in: ["paid", "processing"] },
    }),
  ]);

  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const all = rows
    .filter((r) => r._id !== "expired")
    .reduce((sum, r) => sum + r.count, 0);

  res.status(200).json({
    success: true,
    data: { all, byStatus, refundPending, stockIssue },
  });
});

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select("-payment.authority -payment.verifyLockUntil")
    .populate("user", "phone name email createdAt isBlocked")
    .populate("statusHistory.by", "name phone")
    .populate("adminNotes.by", "name phone")
    .populate("refund.doneBy", "name phone")
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  const [stats] = order.user
    ? await Order.aggregate([
        { $match: { user: order.user._id, status: { $in: REVENUE_STATUSES } } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            spent: { $sum: "$totalAmount" },
          },
        },
      ])
    : [];

  res.status(200).json({
    success: true,
    data: {
      order,
      // سرور مشخص می‌کنه فرانت چه گذارهایی رو نشون بده تا دو طرف از هم جدا نیفتن
      allowedTransitions: ALLOWED_TRANSITIONS[order.status] ?? [],
      customerStats: { orders: stats?.orders ?? 0, spent: stats?.spent ?? 0 },
    },
  });
});

const SHIPPING_EDITABLE = ["paid", "processing", "shipped", "delivered"];

export const updateShipping = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select("status");

  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  if (!SHIPPING_EDITABLE.includes(order.status)) {
    res.status(400);
    throw new Error("برای این وضعیت سفارش نمی‌شود اطلاعات ارسال ثبت کرد");
  }

  const set = {};
  if (req.body.carrier !== undefined)
    set["shipping.carrier"] = req.body.carrier || null;
  if (req.body.trackingCode !== undefined)
    set["shipping.trackingCode"] = req.body.trackingCode || null;

  const updated = await Order.findByIdAndUpdate(
    order._id,
    { $set: set },
    { new: true },
  )
    .select("shipping")
    .lean();

  res.status(200).json({ success: true, data: updated.shipping });
});

// یادداشت داخلی: فقط اضافه می‌شه (برای حفظ سابقه حذف و ویرایش ندارد)
export const addOrderNote = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        adminNotes: { text: req.body.text, by: req.user._id, at: new Date() },
      },
    },
    { new: true, runValidators: true },
  )
    .select("adminNotes")
    .populate("adminNotes.by", "name phone")
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("سفارش یافت نشد");
  }

  res.status(201).json({ success: true, data: order.adminNotes });
});

export const markRefundDone = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, "refund.required": true, "refund.doneAt": null },
    {
      $set: {
        "refund.doneAt": new Date(),
        "refund.doneBy": req.user._id,
        "refund.note": req.body.note || null,
      },
    },
    { new: true },
  )
    .select("refund orderNumber")
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("سفارشی با عودت وجه در انتظار پیدا نشد");
  }
  await logAudit(req, {
    action: "order.refund",
    entityType: "order",
    entityId: order._id,
    entityLabel: order.orderNumber,
    summary: `عودت وجه سفارش ${order.orderNumber} ثبت شد`,
  });

  res.status(200).json({ success: true, data: order.refund });
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  const result = await Order.updateMany(
    { _id: { $in: ids }, status: "paid" },
    {
      $set: { status: "processing" },
      $push: { statusHistory: historyEntry("processing", req.user._id) },
    },
  );

  await logAudit(req, {
    action: "order.bulk-status",
    entityType: "order",
    summary: `${result.modifiedCount} سفارش به «در حال آماده‌سازی» رفت`,
  });

  res.status(200).json({
    success: true,
    data: {
      requested: ids.length,
      updated: result.modifiedCount,
      skipped: ids.length - result.modifiedCount,
    },
  });
});

export const exportOrders = asyncHandler(async (req, res) => {
  const filter = await buildOrderFilter(req.query);

  const total = await Order.countDocuments(filter);
  if (total > EXPORT_LIMIT) {
    res.status(400);
    throw new Error(
      `تعداد سفارش‌ها (${total}) بیشتر از ${EXPORT_LIMIT} است؛ بازه یا فیلتر را محدودتر کنید`,
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="orders-${toTehranDay(new Date())}.csv"`,
  );

  res.write("\uFEFF"); // تا Excel فارسی رو درست نشون بده
  res.write(
    csvRow([
      "شماره سفارش",
      "تاریخ ثبت",
      "تاریخ پرداخت",
      "وضعیت",
      "نام گیرنده",
      "موبایل گیرنده",
      "موبایل حساب",
      "استان",
      "شهر",
      "آدرس",
      "کد پستی",
      "اقلام",
      "تعداد کل",
      "جمع کالاها (تومان)",
      "تخفیف (تومان)",
      "هزینه ارسال (تومان)",
      "مبلغ کل (تومان)",
      "نوع تخفیف",
      "کد تخفیف",
      "کد پیگیری پرداخت",
      "پیک",
      "کد رهگیری",
      "عودت وجه",
    ]),
  );

  const cursor = Order.find(filter)
    .populate("user", "phone")
    .sort({ createdAt: -1, _id: -1 })
    .lean()
    .cursor();

  for await (const o of cursor) {
    const refund = !o.refund?.required
      ? ""
      : o.refund.doneAt
        ? "انجام شد"
        : "در انتظار";

    res.write(
      csvRow([
        o.orderNumber,
        formatJalali(o.createdAt, true),
        formatJalali(o.payment?.paidAt, true),
        STATUS_LABELS[o.status] ?? o.status,
        o.shippingAddress?.fullName,
        o.shippingAddress?.phone,
        o.user?.phone,
        o.shippingAddress?.province,
        o.shippingAddress?.city,
        o.shippingAddress?.addressLine,
        o.shippingAddress?.postalCode,
        o.items.map((i) => `${i.productName} × ${i.quantity}`).join(" | "),
        o.items.reduce((sum, i) => sum + i.quantity, 0),
        o.subtotal,
        o.discountAmount,
        o.shippingCost,
        o.totalAmount,
        o.discountSource === "coupon"
          ? "کد تخفیف"
          : o.discountSource === "loyalty"
            ? "وفاداری"
            : "",
        o.couponCode,
        o.payment?.refId,
        o.shipping?.carrier,
        o.shipping?.trackingCode,
        refund,
      ]),
    );
  }

  res.end();
});
