import asyncHandler from "express-async-handler";
import Category from "./CategoryMd.js";
import { getFileUrl } from "../../Utils/uploadService.js";

// ---------- ساخت دسته‌بندی جدید (ادمین) ----------
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent, isActive } = req.body;

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      res.status(400);
      throw new Error("دسته‌بندی والد یافت نشد");
    }
  }

  const category = await Category.create({
    name,
    parent: parent || null,
    isActive: isActive === undefined ? true : isActive === "true",
    image: req.file ? getFileUrl("categories", req.file.filename) : null,
  });

  res.status(201).json({ success: true, data: category });
});

// ---------- درخت دسته‌بندی‌های فعال (عمومی) ----------
export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).lean();

  const buildTree = (parentId = null) =>
    categories
      .filter((c) => String(c.parent) === String(parentId))
      .map((c) => ({ ...c, children: buildTree(c._id) }));

  res.status(200).json({ success: true, data: buildTree() });
});

// ---------- همه‌ی دسته‌بندی‌ها به‌صورت flat (ادمین - برای پنل مدیریت) ----------
export const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate("parent", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: categories });
});

// ---------- یک دسته‌بندی با slug (عمومی) ----------
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
  });

  if (!category) {
    res.status(404);
    throw new Error("دسته‌بندی یافت نشد");
  }

  res.status(200).json({ success: true, data: category });
});

// ---------- ویرایش دسته‌بندی (ادمین) ----------
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("دسته‌بندی یافت نشد");
  }

  const { name, parent, isActive } = req.body;

  if (parent) {
    if (parent === String(category._id)) {
      res.status(400);
      throw new Error("دسته‌بندی نمی‌تواند والد خودش باشد");
    }
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      res.status(400);
      throw new Error("دسته‌بندی والد یافت نشد");
    }
  }

  if (name) category.name = name;
  if (parent !== undefined) category.parent = parent || null;
  if (isActive !== undefined) category.isActive = isActive === "true";
  if (req.file) category.image = getFileUrl("categories", req.file.filename);

  await category.save();

  res.status(200).json({ success: true, data: category });
});

// ---------- حذف دسته‌بندی (ادمین) ----------
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("دسته‌بندی یافت نشد");
  }

  const hasChildren = await Category.exists({ parent: category._id });

  if (hasChildren) {
    res.status(400);
    throw new Error("ابتدا زیردسته‌های این دسته‌بندی را حذف یا جابه‌جا کنید");
  }

  await category.deleteOne();

  res.status(200).json({ success: true, message: "دسته‌بندی حذف شد" });
});