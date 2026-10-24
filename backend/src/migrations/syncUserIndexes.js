import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import User from "../Modules/User/UserMd.js";

await connectDB();

try {
  await User.collection.dropIndex("email_1");
  console.log("ایندکس قدیمی email_1 حذف شد");
} catch (err) {
  console.log("email_1:", err.message); 
}

await User.syncIndexes();
console.log("ایندکس‌های User همگام شد");

await mongoose.disconnect();
