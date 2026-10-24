import Order from "../Modules/Order/OrderMd.js";

export const expireStaleOrders = async () => {
  const now = new Date();

  const result = await Order.updateMany(
    {
      status: "pending_payment",
      expiresAt: { $lt: now },
      $or: [{ "payment.verifyLockUntil": null }, { "payment.verifyLockUntil": { $lt: now } }],
    },
    {
      $set: { status: "expired" },
      $push: { statusHistory: { status: "expired", at: now, by: null } },
    },
  );

  return result.modifiedCount;
};

export const startOrderExpiryJob = (intervalMs = 10 * 60 * 1000) => {
  const run = async () => {
    try {
      const count = await expireStaleOrders();
      if (count > 0) console.log(`⏱️ ${count} سفارش پرداخت‌نشده منقضی شد`);
    } catch (err) {
      console.error("❌ خطا در جاب منقضی‌کردن سفارش‌ها:", err.message);
    }
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref(); // جلوی بسته‌شدن تمیز پروسه رو نمی‌گیره
  return timer;
};