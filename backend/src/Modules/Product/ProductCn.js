import asyncHandler from "express-async-handler";
import Product from "./ProductMd.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";
import Order from "../Order/OrderMd.js";
import { getFileUrl, deleteUploadedFile } from "../../Utils/uploadService.js";

const MAX_IMAGES = 8;

const parseBool = (value, fallback) =>
  value === undefined ? fallback : String(value) === "true";

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

  const images = req.files
    ? req.files.map((file) => getFileUrl("products", file.filename))
    : [];

  const product = await Product.create({
    name,
    description,
    brand,
    categories,
    variants: variants.map(({ _id, ...rest }) => rest),
    images,
    discountPercent,
    discountStartDate: discountStartDate || null,
    discountEndDate: discountEndDate || null,
    isActive: parseBool(isActive, true),
  });

  res.status(201).json({ success: true, data: product });
});

// ---------- لیست محصولات با فیلتر/صفحه‌بندی (عمومی) ----------
export const getProducts = asyncHandler(async (req, res) => {
  const { category, brand, search, sort, minPrice, maxPrice, inStock, attrs } =
    req.query;
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 12,
    maxLimit: 60,
  });

  const filter = { isActive: true };
  if (category) filter.categories = { $in: String(category).split(",") };
  if (brand) filter.brand = brand;
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

  // ---------- شرط روی حداقل یک واریانت (قیمت، موجودی، ویژگی‌ها) ----------
  const variantElemMatch = {};

  const min = Number(minPrice);
  const max = Number(maxPrice);
  const hasMin =
    minPrice !== undefined && minPrice !== "" && Number.isFinite(min);
  const hasMax =
    maxPrice !== undefined && maxPrice !== "" && Number.isFinite(max);

  if (hasMin || hasMax) {
    variantElemMatch.price = {};
    if (hasMin) variantElemMatch.price.$gte = min;
    if (hasMax) variantElemMatch.price.$lte = max;
  }

  if (inStock === "true") {
    variantElemMatch.stock = { $gt: 0 };
  }

  if (attrs) {
    if (String(attrs).length > 2000) {
      res.status(400);
      throw new Error("فیلتر ویژگی‌ها بیش از حد طولانی است");
    }

    let parsedAttrs = [];
    try {
      parsedAttrs = JSON.parse(attrs);
    } catch {
      res.status(400);
      throw new Error("فرمت فیلتر ویژگی‌ها (attrs) معتبر نیست");
    }

    if (Array.isArray(parsedAttrs)) {
      const valid = parsedAttrs.filter(
        (a) => a && typeof a.name === "string" && typeof a.value === "string",
      );
      if (valid.length > 0) {
        // واریانتی که هم‌زمان همه‌ی ویژگی‌های درخواستی رو داشته باشه
        variantElemMatch.attributes = {
          $all: valid.map((a) => ({
            $elemMatch: { name: a.name, value: a.value },
          })),
        };
      }
    }
  }

  if (Object.keys(variantElemMatch).length > 0) {
    filter.variants = { $elemMatch: variantElemMatch };
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    priceAsc: { "variants.0.price": 1, _id: 1 },
    priceDesc: { "variants.0.price": -1, _id: 1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("brand", "name logo")
      .populate("categories", "name slug")
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: { total, page, pages: Math.ceil(total / limit) },
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
      {
        $or: [
          { discountStartDate: null },
          { discountStartDate: { $lte: now } },
        ],
      },
      { $or: [{ discountEndDate: null }, { discountEndDate: { $gte: now } }] },
    ],
  })
    .populate("brand", "name logo")
    .sort({ discountPercent: -1 });

  res.status(200).json({ success: true, data: products });
});

// ---------- یک محصول با slug (عمومی) ----------
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  })
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

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (brand !== undefined) product.brand = brand;
  if (categories !== undefined) product.categories = categories;
  if (discountPercent !== undefined) product.discountPercent = discountPercent;
  if (discountStartDate !== undefined)
    product.discountStartDate = discountStartDate || null;
  if (discountEndDate !== undefined)
    product.discountEndDate = discountEndDate || null;
  if (isActive !== undefined) product.isActive = parseBool(isActive);

  if (variants !== undefined) {
    const existingById = new Map(
      product.variants.map((v) => [String(v._id), v]),
    );
    const seen = new Set();
    const merged = [];

    for (const incoming of variants) {
      if (!incoming._id) {
        merged.push(incoming); // واریانت جدید
        continue;
      }

      const current = existingById.get(incoming._id);
      if (!current || seen.has(incoming._id)) {
        res.status(400);
        throw new Error("واریانت‌های ارسالی معتبر نیستند");
      }
      seen.add(incoming._id);

      // واریانت موجود: _id حفظ می‌شه تا سبد خرید و سفارش‌ها نشکنن
      current.attributes = incoming.attributes;
      current.price = incoming.price;
      current.stock = incoming.stock;
      if (incoming.sku) current.sku = incoming.sku;
      merged.push(current);
    }

    product.variants = merged;
  }

  if (req.files && req.files.length > 0) {
    const added = req.files.map((file) =>
      getFileUrl("products", file.filename),
    );

    if (product.images.length + added.length > MAX_IMAGES) {
      res.status(400);
      throw new Error(`حداکثر ${MAX_IMAGES} عکس برای هر محصول مجاز است`);
    }

    product.images = [...product.images, ...added];
  }

  await product.save();

  res.status(200).json({ success: true, data: product });
});

export const removeProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  const { imageUrl } = req.body;

  if (!product.images.includes(imageUrl)) {
    res.status(404);
    throw new Error("این عکس متعلق به این محصول نیست");
  }

  product.images = product.images.filter((img) => img !== imageUrl);
  await product.save();

  // اگه سفارشی همین عکس رو snapshot کرده، فایل روی دیسک می‌مونه
  const usedInOrders = await Order.exists({ "items.image": imageUrl });
  if (!usedInOrders) await deleteUploadedFile(imageUrl);

  res.status(200).json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  const usedInOrders = await Order.exists({ "items.product": product._id });
  if (usedInOrders) {
    res.status(409);
    throw new Error(
      "این محصول در سفارش‌ها استفاده شده و حذف نمی‌شود. به‌جای حذف، آن را غیرفعال کنید",
    );
  }

  await product.deleteOne();
  await Promise.all(product.images.map((img) => deleteUploadedFile(img)));

  res.status(200).json({ success: true, message: "محصول حذف شد" });
});
