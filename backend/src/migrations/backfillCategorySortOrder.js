import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import Category from "../Modules/Category/CategoryMd.js";

await connectDB();

const result = await Category.updateMany({ sortOrder: { $exists: false } }, { $set: { sortOrder: 0 } });
console.log(`${result.modifiedCount} دسته‌بندی به‌روز شد`);

await mongoose.disconnect();