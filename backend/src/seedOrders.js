import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./Config/db.js";
import User from "./Modules/User/UserMd.js";
import Product from "./Modules/Product/ProductMd.js";
import Order from "./Modules/Order/OrderMd.js";

if (process.env.NODE_ENV === "production") {
  console.error("❌ این اسکریپت در production اجرا نمی‌شود");
  process.exit(1);
}

const FAKE_PHONE_PREFIX = "09990000";
const SEED_PREFIX = "SEED-";
const ORDER_COUNT = 220;
const DAYS_BACK = 100;
const HOUR = 60 * 60 * 1000;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (list) => list[rand(0, list.length - 1)];

const PROVINCES = [
  ...Array(5).fill("تهران"),
  ...Array(2).fill("اصفهان"),
  "فارس",
  "خراسان رضوی",
  "آذربایجان شرقی",
  "البرز",
  "گیلان",
  "خوزستان",
];

const STATUSES = [
  ...Array(12).fill("delivered"),
  ...Array(2).fill("shipped"),
  "processing",
  "paid",
  ...Array(2).fill("expired"),
  "cancelledUnpaid",
  "returned",
  "cancelledPaid",
];

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23, 8];

await connectDB();

await Order.deleteMany({ orderNumber: { $regex: `^${SEED_PREFIX}` } });
await User.deleteMany({ phone: { $regex: `^${FAKE_PHONE_PREFIX}` } });
console.log("🗑️  داده‌ی نمونه‌ی قبلی پاک شد");

if (process.argv.includes("--clean")) {
  await mongoose.disconnect();
  process.exit(0);
}

const products = await Product.find({ isActive: true }).lean();
if (products.length === 0) {
  console.error("❌ محصولی پیدا نشد. اول npm run seed را اجرا کن");
  process.exit(1);
}

// ---------- کاربران ساختگی (با تاریخ عضویت پراکنده) ----------
const now = Date.now();
const users = Array.from({ length: 12 }, (_, i) => {
  const joined = new Date(now - rand(5, DAYS_BACK + 20) * 24 * HOUR);
  return {
    _id: new mongoose.Types.ObjectId(),
    phone: `${FAKE_PHONE_PREFIX}${String(i + 1).padStart(3, "0")}`,
    name: `کاربر نمونه ${i + 1}`,
    role: "user",
    isVerified: true,
    isBlocked: false,
    pendingLoyaltyDiscount: { percent: 0, expiresAt: null },
    createdAt: joined,
    updatedAt: joined,
  };
});
await User.collection.insertMany(users);

// ---------- سفارش‌های ساختگی ----------
const orders = Array.from({ length: ORDER_COUNT }, (_, n) => {
  const daysAgo = Math.floor(DAYS_BACK * Math.pow(Math.random(), 1.4)); // سفارش‌های اخیر بیشترن
  const createdAt = new Date(now - daysAgo * 24 * HOUR);
  createdAt.setHours(pick(HOURS), rand(0, 59), rand(0, 59), 0);
  if (createdAt.getTime() > now) createdAt.setTime(now - 60 * 1000);

  const items = Array.from({ length: rand(1, 3) }, () => {
    const product = pick(products);
    const variant = pick(product.variants);
    const quantity = rand(1, 3);
    const unitPrice = Math.round(variant.price * (1 - (product.discountPercent || 0) / 100));
    return {
      product: product._id,
      variantId: variant._id,
      productName: product.name,
      attributes: variant.attributes.map((a) => ({ name: a.name, value: a.value })),
      image: product.images?.[0] ?? null,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const roll = Math.random();
  const discountSource = roll < 0.7 ? null : roll < 0.85 ? "coupon" : "loyalty";
  const discountAmount =
    discountSource === "coupon"
      ? Math.round(subtotal * 0.1)
      : discountSource === "loyalty"
        ? Math.round(subtotal * 0.05)
        : 0;
  const shippingCost = subtotal >= 500000 ? 0 : 30000;

  const kind = pick(STATUSES);
  const paid = ["delivered", "shipped", "processing", "paid", "returned", "cancelledPaid"].includes(kind);
  const status =
    kind === "cancelledUnpaid" || kind === "cancelledPaid" ? "cancelled" : kind;
  const paidAt = paid ? new Date(createdAt.getTime() + rand(2, 15) * 60 * 1000) : null;
  const user = pick(users);

  return {
    orderNumber: `${SEED_PREFIX}${String(n + 1).padStart(5, "0")}`,
    user: user._id,
    items,
    shippingAddress: {
      fullName: user.name,
      phone: user.phone,
      province: pick(PROVINCES),
      city: "شهر نمونه",
      addressLine: "خیابان نمونه، پلاک ۱۲",
      postalCode: "1234567890",
    },
    subtotal,
    shippingCost,
    discountAmount,
    discountSource,
    couponCode: discountSource === "coupon" ? "WELCOME10" : null,
    couponId: null,
    totalAmount: subtotal - discountAmount + shippingCost,
    status,
    payment: {
      authority: `SEEDAUTH${n + 1}`,
      refId: paid ? `SEED-REF-${n + 1}` : null,
      paidAt,
      verifyLockUntil: null,
    },
    stockDeducted: false,
    stockIssue: false,
    statusHistory: [{ status: "pending_payment", at: createdAt, by: null }],
    expiresAt: new Date(createdAt.getTime() + 24 * HOUR),
    createdAt,
    updatedAt: paidAt ?? createdAt,
  };
});

await Order.collection.insertMany(orders);

console.log(`✅ ${users.length} کاربر و ${orders.length} سفارش نمونه ساخته شد`);
await mongoose.disconnect();