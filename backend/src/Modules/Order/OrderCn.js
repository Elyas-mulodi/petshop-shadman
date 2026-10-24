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
import { buildDateFilter } from "../../Utils/dateRange.js";

const historyEntry = (status, by = null) => ({ status, at: new Date(), by });
const PAYABLE_STATUSES = ["pending_payment", "expired"];
const LOCK_MS = 60 * 1000;
const lockIsFree = (now) => [
  { "payment.verifyLockUntil": null },
  { "payment.verifyLockUntil": { $lt: now } },
];

const getShippingCost = (subtotal) => {
  const flatCost = Number(process.env.SHIPPING_COST || 0);
  const freeThreshold = Number(process.env.FREE_SHIPPING_THRESHOLD || 0);
  return subtotal >= freeThreshold ? 0 : flatCost;
};

// ---------- تنظیمات ارسال (عمومی) ----------
export const getShippingConfig = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      shippingCost: Number(process.env.SHIPPING_COST || 0),
      freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 0),
    },
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

  const shippingCost = getShippingCost(subtotal);
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

  // ---------- شروع پرداخت با زرین‌پال ----------
  const payment = await requestPayment({
    amountToman: totalAmount,
    description: `پرداخت سفارش ${order.orderNumber} - پت شاپ شادمان`,
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

  if (!Authority || typeof Authority !== "string") {
    return res.redirect(`${resultUrl}?status=not-found`);
  }

  const order = await Order.findOne({ "payment.authority": Authority });

  if (!order) {
    return res.redirect(`${resultUrl}?status=not-found`);
  }

  const orderQuery = `order=${order.orderNumber}`;

  if (!PAYABLE_STATUSES.includes(order.status)) {
    return res.redirect(`${resultUrl}?status=already-processed&${orderQuery}`);
  }

  if (Status !== "OK") {
    return res.redirect(`${resultUrl}?status=failed&${orderQuery}`);
  }

  // ---------- قفل: فقط یک درخواست هم‌زمان اجازه‌ی تایید پرداخت داره ----------
  const now = new Date();
  const locked = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending_payment", $or: lockIsFree(now) },
    { $set: { "payment.verifyLockUntil": new Date(now.getTime() + LOCK_MS) } },
    { new: true },
  );

  if (!locked) {
    return res.redirect(`${resultUrl}?status=already-processed&${orderQuery}`);
  }

  const verifyResult = await verifyPayment({
    authority: Authority,
    amountToman: locked.totalAmount,
  });

  if (!verifyResult.success) {
    await Order.updateOne(
      { _id: locked._id },
      { $set: { "payment.verifyLockUntil": null } },
    );
    return res.redirect(`${resultUrl}?status=failed&${orderQuery}`);
  }

  // ---------- انتقال اتمیک به paid ----------
  const paid = await Order.findOneAndUpdate(
    { _id: order._id, status: { $in: PAYABLE_STATUSES }, $or: lockIsFree(now) },
    {
      $set: {
        status: "paid",
        "payment.refId": verifyResult.refId,
        "payment.paidAt": new Date(),
        "payment.verifyLockUntil": null,
      },
      $push: { statusHistory: historyEntry("paid") },
    },
    { new: true },
  );

  if (!paid) {
    console.error(
      `⚠️ Payment verified but order not pending: ${locked.orderNumber} (refId ${verifyResult.refId})`,
    );
    return res.redirect(`${resultUrl}?status=already-processed&${orderQuery}`);
  }

  // ---------- کسر موجودی: اگه کم بیاد منفی می‌شه و سفارش پرچم می‌خوره ----------
  let oversold = false;

  for (const item of paid.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: locked._id, status: { $in: PAYABLE_STATUSES } },
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

  if (oversold) {
    console.error(`⚠️ Oversold items in order ${paid.orderNumber}`);
  }

  // ---------- کارهای بعد از پرداخت: خطای هر کدوم، پرداخت موفق رو باطل نمی‌کنه ----------
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

  return res.redirect(`${resultUrl}?status=success&${orderQuery}`);
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
    description: `پرداخت سفارش ${order.orderNumber} - پت شاپ شادمان`,
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
  const { status, search, from, to, stockIssue } = req.query;
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const filter = {};
  filter.status = status ? status : { $ne: "expired" };
  if (stockIssue === "true") filter.stockIssue = true;

  const dateRange = buildDateFilter(from, to);
  if (dateRange) filter.createdAt = dateRange;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const users = await User.find({ phone: rx }).select("_id").limit(50).lean();

    filter.$or = [
      { orderNumber: rx },
      { "shippingAddress.phone": rx },
      { "shippingAddress.fullName": rx },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(
        "orderNumber user status totalAmount discountAmount stockIssue createdAt payment.paidAt shippingAddress.fullName shippingAddress.phone items.productName items.quantity",
      )
      .populate("user", "phone name")
      .sort({ createdAt: -1, _id: -1 })
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
  const { status } = req.body;
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

  // تغییر اتمیک: اگه ادمین دیگه‌ای هم‌زمان وضعیت رو عوض کرده باشه، این درخواست رد می‌شه
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    {
      $set: { status },
      $push: { statusHistory: historyEntry(status, req.user._id) },
    },
    { new: true },
  );

  if (!updated) {
    res.status(409);
    throw new Error("وضعیت سفارش هم‌زمان تغییر کرد، صفحه را تازه کنید");
  }

  const isReversal = status === "cancelled" || status === "returned";

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

  res.status(200).json({
    success: true,
    data: updated,
    refundRequired: isReversal && !!updated.payment?.refId,
  });
});
