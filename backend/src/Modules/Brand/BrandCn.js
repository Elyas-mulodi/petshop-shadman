import asyncHandler from "express-async-handler";
import Brand from "./BrandMd.js";
import { getFileUrl } from "../../Utils/uploadService.js";

export const createBrand = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;

  const brand = await Brand.create({
    name,
    isActive: isActive === undefined ? true : isActive === "true",
    logo: req.file ? getFileUrl("brands", req.file.filename) : null,
  });

  res.status(201).json({ success: true, data: brand });
});

export const getAllBrands = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  const brands = await Brand.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, data: brands });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("برند یافت نشد");
  }

  const { name, isActive } = req.body;

  if (name) brand.name = name;
  if (isActive !== undefined) brand.isActive = isActive === "true";
  if (req.file) brand.logo = getFileUrl("brands", req.file.filename);

  await brand.save();

  res.status(200).json({ success: true, data: brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("برند یافت نشد");
  }

  await brand.deleteOne();

  res.status(200).json({ success: true, message: "برند حذف شد" });
});