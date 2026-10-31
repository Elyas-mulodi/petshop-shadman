import asyncHandler from "express-async-handler";
import Brand from "./BrandMd.js";
import Product from "../Product/ProductMd.js";
import { getFileUrl, deleteUploadedFile } from "../../Utils/uploadService.js";

export const createBrand = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;

  const brand = await Brand.create({
    name,
    isActive: isActive === undefined ? true : isActive === "true",
    logo: req.file ? getFileUrl("brands", req.file.filename) : null,
  });

  res.status(201).json({ success: true, data: brand });
});

// ---------- لیست عمومی: فقط برندهای فعال ----------
export const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, data: brands });
});

// ---------- لیست مدیریتی: همه‌ی برندها با تعداد محصول ----------
export const getAdminBrands = asyncHandler(async (req, res) => {
  const [brands, rows] = await Promise.all([
    Brand.find().sort({ name: 1 }).collation({ locale: "fa" }).lean(),
    Product.aggregate([{ $group: { _id: "$brand", count: { $sum: 1 } } }]),
  ]);

  const counts = new Map(rows.map((r) => [String(r._id), r.count]));

  res.status(200).json({
    success: true,
    data: brands.map((b) => ({
      ...b,
      productCount: counts.get(String(b._id)) ?? 0,
    })),
  });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("برند یافت نشد");
  }

  const { name, isActive, removeLogo } = req.body;

  if (name !== undefined) brand.name = name;
  if (isActive !== undefined) brand.isActive = isActive === "true";

  const oldLogo = brand.logo;
  if (req.file) brand.logo = getFileUrl("brands", req.file.filename);
  else if (removeLogo === "true") brand.logo = null;

  await brand.save();

  if (oldLogo && oldLogo !== brand.logo) await deleteUploadedFile(oldLogo);

  res.status(200).json({ success: true, data: brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("برند یافت نشد");
  }

  const productCount = await Product.countDocuments({ brand: brand._id });
  if (productCount > 0) {
    res.status(409);
    throw new Error(
      `این برند ${productCount} محصول دارد؛ ابتدا محصولات را به برند دیگری ببرید`,
    );
  }

  await brand.deleteOne();
  await deleteUploadedFile(brand.logo);

  res.status(200).json({ success: true, message: "برند حذف شد" });
});
