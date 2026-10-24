import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import Order from "../Modules/Order/OrderMd.js";

await connectDB();

const dropped = await Order.syncIndexes();
console.log("ایندکس‌های حذف‌شده:", dropped);

await mongoose.disconnect();
