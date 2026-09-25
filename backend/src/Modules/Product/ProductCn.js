import asyncHandler from "express-async-handler";
import Product from "./ProductMd.js";
import { getFileUrl } from "../../Utils/uploadService.js";

// ---------- ساخت محصول (ادمین) ----------
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    brand,
    categories,
    variants,
    discountPercent,
    discountStartDate,
    discountEndDate,
    isActive,
  } = req.body;

  const images = req.files ? req.files.map((file) => getFileUrl("products", file.filename)) : [];

  const product = await Product.create({
    name,
    description,
    brand,
    categories,
    variants,
    images,
    discountPercent,
    discountStartDate: discountStartDate || null,
    discountEndDate: discountEndDate || null,
    isActive: isActive === undefined ? true : isActive === "true",
  });

  res.status(201).json({ success: true, data: product });
});

// ---------- لیست محصولات با فیلتر/صفحه‌بندی (عمومی) ----------
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    brand,
    page = 1,
    limit = 12,
    search,
    sort,
    minPrice,
    maxPrice,
    inStock,
    attrs,
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.categories = category;
  if (brand) filter.brand = brand;
  if (search) filter.name = { $regex: search, $options: "i" };

  // ---------- ساخت شرط روی حداقل یک واریانت (قیمت، موجودی، ویژگی‌ها) ----------
  const variantElemMatch = {};

  if (minPrice || maxPrice) {
    variantElemMatch.price = {};
    if (minPrice) variantElemMatch.price.$gte = Number(minPrice);
    if (maxPrice) variantElemMatch.price.$lte = Number(maxPrice);
  }

  if (inStock === "true") {
    variantElemMatch.stock = { $gt: 0 };
  }

  if (attrs) {
    let parsedAttrs = [];
    try {
      parsedAttrs = JSON.parse(attrs);
    } catch {
      res.status(400);
      throw new Error("فرمت فیلتر ویژگی‌ها (attrs) معتبر نیست");
    }

    if (Array.isArray(parsedAttrs) && parsedAttrs.length > 0) {
      // هر واریانتی که هم‌زمان همه‌ی ویژگی‌های درخواستی رو داشته باشه (مثلا هم وزن=3کیلو هم طعم=مرغ)
      variantElemMatch.attributes = {
        $all: parsedAttrs.map((a) => ({ $elemMatch: { name: a.name, value: a.value } })),
      };
    }
  }

  if (Object.keys(variantElemMatch).length > 0) {
    filter.variants = { $elemMatch: variantElemMatch };
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    priceAsc: { "variants.0.price": 1 },
    priceDesc: { "variants.0.price": -1 },
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("brand", "name logo")
      .populate("categories", "name slug")
      .sort(sortOptions[sort] || { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ---------- محصولات جدید (۱۴ روز اخیر) ----------
export const getNewProducts = asyncHandler(async (req, res) => {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const products = await Product.find({
    isActive: true,
    createdAt: { $gte: fourteenDaysAgo },
  })
    .populate("brand", "name logo")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: products });
});

// ---------- محصولات تخفیف‌دار ----------
export const getDiscountedProducts = asyncHandler(async (req, res) => {
  const now = new Date();

  const products = await Product.find({
    isActive: true,
    discountPercent: { $gt: 0 },
    $and: [
      { $or: [{ discountStartDate: null }, { discountStartDate: { $lte: now } }] },
      { $or: [{ discountEndDate: null }, { discountEndDate: { $gte: now } }] },
    ],
  })
    .populate("brand", "name logo")
    .sort({ discountPercent: -1 });

  res.status(200).json({ success: true, data: products });
});

// ---------- یک محصول با slug (عمومی) ----------
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate("brand", "name logo")
    .populate("categories", "name slug");

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  res.status(200).json({ success: true, data: product });
});

// ---------- ویرایش محصول (ادمین) ----------
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  const fields = [
    "name",
    "description",
    "brand",
    "categories",
    "variants",
    "discountPercent",
    "discountStartDate",
    "discountEndDate",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.isActive !== undefined) product.isActive = req.body.isActive === "true";

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => getFileUrl("products", file.filename));
    product.images = [...product.images, ...newImages];
  }

  await product.save();

  res.status(200).json({ success: true, data: product });
});

// ---------- حذف یک عکس مشخص از محصول (ادمین) ----------
export const removeProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  product.images = product.images.filter((img) => img !== req.body.imageUrl);
  await product.save();

  res.status(200).json({ success: true, data: product });
});

// ---------- حذف محصول (ادمین) ----------
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  await product.deleteOne();

  res.status(200).json({ success: true, message: "محصول حذف شد" });
});