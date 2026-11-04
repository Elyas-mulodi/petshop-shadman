import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import User from "../Modules/User/UserMd.js";
import Order from "../Modules/Order/OrderMd.js";
import Cart from "../Modules/Cart/CartMd.js";
import Coupon from "../Modules/Coupon/CouponMd.js";

const apply = process.argv.includes("--apply"); // بدون این پرچم فقط گزارش می‌ده

await connectDB();

const groups = await User.aggregate([
  { $group: { _id: "$phone", ids: { $push: "$_id" }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
]);

if (groups.length === 0) console.log("شماره‌ی تکراری پیدا نشد");

for (const group of groups) {
  const users = await User.find({ _id: { $in: group.ids } }).lean();
  const orderCounts = await Order.aggregate([
    { $match: { user: { $in: group.ids } } },
    { $group: { _id: "$user", n: { $sum: 1 } } },
  ]);
  const counts = new Map(orderCounts.map((o) => [String(o._id), o.n]));

  const ranked = [...users].sort(
    (a, b) =>
      (b.role === "admin") - (a.role === "admin") ||
      (b.isVerified === true) - (a.isVerified === true) ||
      (counts.get(String(b._id)) ?? 0) - (counts.get(String(a._id)) ?? 0) ||
      new Date(a.createdAt) - new Date(b.createdAt),
  );
  const [keeper, ...extras] = ranked;

  console.log(
    `${group._id}: حساب اصلی ${keeper._id}، ادغام ${extras.map((u) => u._id).join("، ")}`,
  );
  if (!apply) continue;

  for (const extra of extras) {
    await Order.updateMany({ user: extra._id }, { $set: { user: keeper._id } });

    await Coupon.updateMany(
      { usedBy: extra._id },
      { $addToSet: { usedBy: keeper._id } },
    );
    await Coupon.updateMany(
      { usedBy: extra._id },
      { $pull: { usedBy: extra._id } },
    );

    const keeperCart = await Cart.exists({ user: keeper._id });
    if (keeperCart) await Cart.deleteOne({ user: extra._id });
    else
      await Cart.updateOne({ user: extra._id }, { $set: { user: keeper._id } });

    await User.deleteOne({ _id: extra._id });
  }
}

if (apply) {
  await User.syncIndexes(); // ساخت دوباره‌ی ایندکس یکتای phone
  console.log("ایندکس‌ها همگام شد");
} else if (groups.length > 0) {
  console.log(
    "این فقط گزارش بود. برای اعمال: npm run migrate:dedupe-users -- --apply",
  );
}

await mongoose.disconnect();
