import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../Config/db.js";
import Product from "../Modules/Product/ProductMd.js";

await connectDB();

let count = 0;
for await (const product of Product.find()
  .select("variants.price")
  .lean()
  .cursor()) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  await Product.updateOne({ _id: product._id }, { $set: { minPrice } });
  count++;
}

console.log(`minPrice برای ${count} محصول محاسبه شد`);
await mongoose.disconnect();
