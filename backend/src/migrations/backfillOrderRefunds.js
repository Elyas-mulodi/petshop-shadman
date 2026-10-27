import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import Order from "../Modules/Order/OrderMd.js";

await connectDB();

const result = await Order.updateMany(
  {
    status: { $in: ["cancelled", "returned"] },
    "payment.refId": { $ne: null },
    "refund.required": { $ne: true },
  },
  { $set: { "refund.required": true } },
);

console.log(`${result.modifiedCount} سفارش به لیست عودت وجه اضافه شد`);
await mongoose.disconnect();