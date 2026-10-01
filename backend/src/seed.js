import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Category from "./Modules/Category/CategoryMd.js";
import Brand from "./Modules/Brand/BrandMd.js";
import Product from "./Modules/Product/ProductMd.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // پاک کردن داده‌های قبلی این سه مدل (فقط همینا، به User و Order کاری نداره)
  await Promise.all([
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
  ]);
  console.log("🗑️  Old Category/Brand/Product data cleared");

  // ---------- دسته‌بندی‌ها ----------
  const dog = await Category.create({ name: "سگ" });
  const dogFood = await Category.create({ name: "غذای سگ", parent: dog._id });
  const dogAccessory = await Category.create({
    name: "اکسسوری سگ",
    parent: dog._id,
  });

  const cat = await Category.create({ name: "گربه" });
  const catFood = await Category.create({ name: "غذای گربه", parent: cat._id });
  const catLitter = await Category.create({
    name: "خاک گربه",
    parent: cat._id,
  });

  console.log("✅ Categories created");

  // ---------- برندها ----------
  const royalCanin = await Brand.create({ name: "Royal Canin" });
  const purina = await Brand.create({ name: "Purina" });
  const catsBest = await Brand.create({ name: "Cat's Best" });

  console.log("✅ Brands created");

  // ---------- محصولات ----------
  await Product.create([
    {
      name: "غذای خشک سگ بالغ رویال کنین",
      description:
        "غذای خشک کامل و متعادل برای سگ‌های بالغ نژاد متوسط، حاوی پروتئین باکیفیت و فیبر گیاهی.",
      brand: royalCanin._id,
      categories: [dog._id, dogFood._id],
      variants: [
        {
          attributes: [{ name: "وزن", value: "1 کیلوگرم" }],
          price: 450000,
          stock: 25,
        },
        {
          attributes: [{ name: "وزن", value: "3 کیلوگرم" }],
          price: 1200000,
          stock: 15,
        },
        {
          attributes: [{ name: "وزن", value: "10 کیلوگرم" }],
          price: 3600000,
          stock: 8,
        },
      ],
      discountPercent: 15,
      discountStartDate: new Date(),
      discountEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      name: "غذای خشک سگ توله پوریینا",
      description:
        "فرمول مخصوص توله‌سگ‌ها برای رشد سالم استخوان و عضله، با طعم مرغ و برنج.",
      brand: purina._id,
      categories: [dog._id, dogFood._id],
      variants: [
        {
          attributes: [{ name: "وزن", value: "1.5 کیلوگرم" }],
          price: 380000,
          stock: 30,
        },
        {
          attributes: [{ name: "وزن", value: "4 کیلوگرم" }],
          price: 950000,
          stock: 12,
        },
      ],
    },
    {
      name: "قلاده چرمی سگ",
      description:
        "قلاده چرم طبیعی با دوخت مقاوم، قابل تنظیم برای نژادهای متوسط تا بزرگ.",
      brand: purina._id,
      categories: [dog._id, dogAccessory._id],
      variants: [
        {
          attributes: [
            { name: "رنگ", value: "قهوه‌ای" },
            { name: "سایز", value: "متوسط" },
          ],
          price: 320000,
          stock: 18,
        },
        {
          attributes: [
            { name: "رنگ", value: "مشکی" },
            { name: "سایز", value: "بزرگ" },
          ],
          price: 350000,
          stock: 10,
        },
      ],
    },
    {
      name: "غذای خشک گربه بالغ رویال کنین",
      description:
        "غذای خشک مخصوص گربه‌های بالغ با طعم مرغ، کمک به سلامت کلیه و دستگاه گوارش.",
      brand: royalCanin._id,
      categories: [cat._id, catFood._id],
      variants: [
        {
          attributes: [{ name: "وزن", value: "1 کیلوگرم" }],
          price: 420000,
          stock: 20,
        },
        {
          attributes: [{ name: "وزن", value: "2 کیلوگرم" }],
          price: 800000,
          stock: 14,
        },
      ],
      discountPercent: 10,
      discountStartDate: new Date(),
      discountEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      name: "کنسرو غذای گربه با طعم ماهی",
      description:
        "کنسرو مرطوب با تکه‌های واقعی ماهی، مناسب وعده روزانه یا تشویقی.",
      brand: purina._id,
      categories: [cat._id, catFood._id],
      variants: [
        {
          attributes: [{ name: "طعم", value: "ماهی تن" }],
          price: 85000,
          stock: 40,
        },
        {
          attributes: [{ name: "طعم", value: "سالمون" }],
          price: 95000,
          stock: 35,
        },
      ],
    },
    {
      name: "خاک گربه بنتونیتی توپی‌دار",
      description:
        "خاک بهداشتی با جذب بالا و کنترل بو، توپی‌شدن سریع برای تمیزکاری آسان.",
      brand: catsBest._id,
      categories: [cat._id, catLitter._id],
      variants: [
        {
          attributes: [{ name: "وزن", value: "5 کیلوگرم" }],
          price: 250000,
          stock: 22,
        },
        {
          attributes: [{ name: "وزن", value: "10 کیلوگرم" }],
          price: 460000,
          stock: 0,
        },
      ],
    },
  ]);

  console.log("✅ Products created");
  console.log("🎉 Seed completed successfully");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
