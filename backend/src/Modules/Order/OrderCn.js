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
  });

  // ---------- شروع پرداخت با زرین‌پال ----------
  const payment = await requestPayment({
    amountToman: totalAmount,
    description: `پرداخت سفارش ${order.orderNumber} - پت شاپ شادمان`,
    mobile: req.user.phone,
  });

  if (!payment.success) {
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
});

// ---------- بازگشت از درگاه و تایید پرداخت ----------
// نکته: مرورگر کاربر مستقیماً به این آدرس ریدایرکت می‌شه (بدون نیاز به لاگین)
export const verifyOrderPayment = asyncHandler(async (req, res) => {
  const { Authority, Status } = req.query;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resultUrl = `${clientUrl}/checkout/result`;

  const order = await Order.findOne({ "payment.authority": Authority });

  if (!order) {
    return res.redirect(`${resultUrl}?status=not-found`);
  }

  if (order.status !== "pending_payment") {
    // قبلاً پردازش شده (مثلاً کاربر رفرش کرده)
    return res.redirect(
      `${resultUrl}?status=already-processed&order=${order.orderNumber}`,
    );
  }

  if (Status !== "OK") {
    return res.redirect(
      `${resultUrl}?status=failed&order=${order.orderNumber}`,
    );
  }

  const verifyResult = await verifyPayment({
    authority: Authority,
    amountToman: order.totalAmount,
  });

  if (!verifyResult.success) {
    return res.redirect(
      `${resultUrl}?status=failed&order=${order.orderNumber}`,
    );
  }

  // ---------- پرداخت موفق: ثبت پرداخت و کسر موجودی ----------
  order.status = "paid";
  order.payment.refId = verifyResult.refId;
  order.payment.paidAt = new Date();

  if (!order.stockDeducted) {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -item.quantity } },
      );
    }
    order.stockDeducted = true;
  }

  await order.save();

  // ---------- کارهای بعد از پرداخت: اگه خطا بدن، پرداخت موفق باطل نمی‌شه ----------
  try {
    const user = await User.findById(order.user);

    if (order.discountSource === "coupon" && order.couponId) {
      await markCouponAsUsed(order.couponId, order.user);
    } else if (order.discountSource === "loyalty") {
      user.pendingLoyaltyDiscount = { percent: 0, expiresAt: null };
      await user.save();
    }

    // اعطای تخفیف پلکانی بعدی بر اساس مبلغ همین سفارش
    await grantLoyaltyDiscount(user, order.subtotal);

    // خالی کردن سبد خرید
    await Cart.updateOne({ user: order.user }, { items: [] });

    // پیامک تایید سفارش (بدون await؛ خطای پیامک نباید چیزی رو خراب کنه)
    sendSms(
      user.phone,
      orderConfirmedSms(order.orderNumber, order.totalAmount),
    ).catch((err) =>
      console.error("خطا در ارسال پیامک تایید سفارش:", err.message),
    );
  } catch (err) {
    console.error(
      `❌ Post-payment tasks failed for order ${order.orderNumber}:`,
      err,
    );
  }

  return res.redirect(`${resultUrl}?status=success&order=${order.orderNumber}`);
});

// ---------- سفارش‌های کاربر ----------
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    // سفارش پرداخت‌نشده‌ای که مهلتش تموم شده و هنوز توسط TTL پاک نشده، نمایش داده نمی‌شه
    $nor: [{ status: "pending_payment", expiresAt: { $lt: new Date() } }],
  })
    .select("-payment.authority")
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
    { _id: req.params.id, user: req.user._id, status: "pending_payment" },
    { status: "cancelled" },
    { new: true },
  );

  if (!order) {
    res.status(404);
    throw new Error("سفارش پیدا نشد یا دیگر قابل لغو نیست");
  }

  res
    .status(200)
    .json({ success: true, data: { _id: order._id, status: order.status } });
});

// ---------- جزئیات یک سفارش (کاربر فقط سفارش خودش، ادمین همه) ----------
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

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
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ---------- تغییر وضعیت سفارش (فقط ادمین) ----------
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

  // اگه سفارش لغو/مرجوع بشه و قبلاً موجودی کسر شده بود، برگردونیم به انبار
  if (
    (status === "cancelled" || status === "returned") &&
    order.stockDeducted
  ) {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } },
      );
    }
    order.stockDeducted = false;
  }

  order.status = status;
  await order.save();

  // پیامک تغییر وضعیت (بدون await؛ خطای پیامک نباید تغییر وضعیت رو خراب کنه)
  const user = await User.findById(order.user);

  if (user && status === "shipped") {
    sendSms(user.phone, orderShippedSms(order.orderNumber)).catch((err) =>
      console.error("خطا در ارسال پیامک ارسال سفارش:", err.message),
    );
  } else if (user && status === "delivered") {
    sendSms(user.phone, orderDeliveredSms(order.orderNumber)).catch((err) =>
      console.error("خطا در ارسال پیامک تحویل سفارش:", err.message),
    );
  }

  res.status(200).json({ success: true, data: order });
});
