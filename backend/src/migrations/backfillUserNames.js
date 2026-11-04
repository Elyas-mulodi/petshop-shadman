import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import User from "../Modules/User/UserMd.js";
import Order from "../Modules/Order/OrderMd.js";

await connectDB();

const users = await User.find({ role: "user", $or: [{ name: null }, { name: "" }] }).select("_id").lean();

let updated = 0;
for (const user of users) {
  const last = await Order.findOne({ user: user._id })
    .sort({ createdAt: -1 })
    .select("shippingAddress.fullName")
    .lean();

  const name = last?.shippingAddress?.fullName?.slice(0, 50);
  if (name) {
    await User.updateOne({ _id: user._id }, { $set: { name } });
    updated += 1;
  }
}

console.log(`${updated} از ${users.length} کاربر بدون نام، نام گرفتند`);
await mongoose.disconnect();