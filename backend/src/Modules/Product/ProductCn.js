import asyncHandler from "express-async-handler";
import Product from "./ProductMd.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";
import Order from "../Order/OrderMd.js";
import { getFileUrl, deleteUploadedFile } from "../../Utils/uploadService.js";
import { getLowStockThreshold } from "../../Utils/settings.js";
import { logAudit } from "../../Utils/audit.js";
import mongoose from "mongoose";
import { csvRow } from "../../Utils/csv.js";
import { toTehranDay } from "../../Utils/dateRange.js";

const PRODUCT_AUDIT_FIELDS = {
  name: "نام",
  isActive: "فعال بودن",
  discountPercent: "درصد تخفیف",
  discountStartDate: "شروع تخفیف",
  discountEndDate: "پایان تخفیف",
};

const ADMIN_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  nameAsc: { name: 1, _id: 1 },
  priceAsc: { minPrice: 1, _id: 1 },
  priceDesc: { minPrice: -1, _id: -1 },
};

const lowStockThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD || 5);

const isDiscountActiveNow = (p, now) =>
  p.discountPercent > 0 &&
  (!p.discountStartDate || now >= p.discountStartDate) &&
  (!p.discountEndDate || now <= p.discountEndDate);

// فیلتر لیست ادمین
const buildAdminFilter = (
  { search, category, brand, active, stock, discount } = {},
  threshold = 5,
) => {
  const filter = {};
  const and = [];

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { slug: rx }, { "variants.sku": rx }];
  }

  if (category) filter.categories = category;
  if (brand) filter.brand = brand;
  if (active) filter.isActive = active === "true";

  // محصولات ناموجود
  if (stock === "out") {
    and.push({
      variants: {
        $not: {
          $elemMatch: { stock: { $gt: 0 } },
        },
      },
    });
  }

  // محصولات با موجودی کم
  if (stock === "low") {
    and.push({
      variants: {
        $elemMatch: {
          stock: { $gt: 0, $lte: threshold },
        },
      },
    });
  }

  // محصولات موجود
  if (stock === "in") {
    and.push({
      variants: {
        $elemMatch: {
          stock: { $gt: threshold },
        },
      },
    });
  }

  // محصولات دارای تخفیف فعال
  if (discount === "active") {
    const now = new Date();

    and.push(
      { discountPercent: { $gt: 0 } },
      {
        $or: [
          { discountStartDate: null },
          { discountStartDate: { $lte: now } },
        ],
      },
      {
        $or: [{ discountEndDate: null }, { discountEndDate: { $gte: now } }],
      },
    );
  }

  // محصولات بدون تخفیف
  if (discount === "none") {
    and.push({
      discountPercent: { $not: { $gt: 0 } },
    });
  }

  if (and.length > 0) {
    filter.$and = and;
  }

  return filter;
};

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

  await logAudit(req, {
    action: "product.create",
    entityType: "product",
    entityId: product._id,
    entityLabel: product.name,
    summary: `محصول «${product.name}» ساخته شد`,
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

  const beforeSnapshot = {
    name: product.name,
    isActive: product.isActive,
    discountPercent: product.discountPercent,
    discountStartDate: product.discountStartDate,
    discountEndDate: product.discountEndDate,
  };
  const beforePrices = new Map(
    product.variants.map((v) => [String(v._id), v.price]),
  );

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
      // واریانت موجود: _id حفظ می‌شه تا سبد خرید و سفارش‌ها نشکنن.
      // موجودی عمداً دست نمی‌خوره (فقط سفارش‌ها و ویرایش سریع موجودی اون رو عوض می‌کنن)
      current.attributes = incoming.attributes;
      current.price = incoming.price;
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
  const changes = diffObjects(beforeSnapshot, product, PRODUCT_AUDIT_FIELDS);
  for (const v of product.variants) {
    const old = beforePrices.get(String(v._id));
    if (old !== undefined && old !== v.price) {
      changes.push({
        field: `price:${v._id}`,
        label: `قیمت (${v.attributes.map((a) => a.value).join("، ")})`,
        from: old,
        to: v.price,
      });
    }
  }

  await logAudit(req, {
    action: "product.update",
    entityType: "product",
    entityId: product._id,
    entityLabel: product.name,
    summary: changes.length
      ? `محصول «${product.name}» ویرایش شد: ${changes.map((c) => c.label).join("، ")}`
      : `محصول «${product.name}» ذخیره شد`,
    changes,
  });

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
  await logAudit(req, {
    action: "product.delete",
    entityType: "product",
    entityLabel: product.name,
    summary: `محصول «${product.name}» حذف شد`,
  });

  res.status(200).json({ success: true, message: "محصول حذف شد" });
});

// ---------- لیست ادمین ----------
export const getAdminProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const threshold = await getLowStockThreshold();
  const filter = buildAdminFilter(req.query, threshold);
  const sort = req.query.sort in ADMIN_SORTS ? req.query.sort : "newest";
  const now = new Date();

  let query = Product.find(filter)
    .select(
      "name slug images isActive minPrice discountPercent discountStartDate discountEndDate createdAt brand categories variants.price variants.stock",
    )
    .populate("brand", "name")
    .populate("categories", "name parent")
    .sort(ADMIN_SORTS[sort])
    .skip(skip)
    .limit(limit)
    .lean();

  if (sort === "nameAsc")
    query = query.collation({ locale: "fa", strength: 2 });

  const [products, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  const data = products.map((p) => {
    const stocks = p.variants.map((v) => v.stock);
    const prices = p.variants.map((v) => v.price);

    // محصول به دسته‌ی والد و زیردسته هر دو وصله؛ فقط زیردسته (یا دسته‌ی بدون فرزند) نمایش داده می‌شه
    const parentIds = new Set(p.categories.map((c) => String(c.parent)));
    const categories = p.categories
      .filter((c) => !parentIds.has(String(c._id)))
      .map((c) => ({ _id: c._id, name: c.name }));

    return {
      _id: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] ?? null,
      isActive: p.isActive,
      brand: p.brand ? { _id: p.brand._id, name: p.brand.name } : null,
      categories,
      variantsCount: p.variants.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock: stocks.reduce((sum, n) => sum + n, 0),
      stockStatus: stocks.every((n) => n <= 0)
        ? "out"
        : stocks.some((n) => n > 0 && n <= threshold)
          ? "low"
          : "ok",
      discountPercent: p.discountPercent,
      discountActive: isDiscountActiveNow(p, now),
      createdAt: p.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    data,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// ---------- شمارنده‌ی تب‌ها ----------
export const getAdminProductCounts = asyncHandler(async (req, res) => {
  const threshold = await getLowStockThreshold();
  const [all, active, outOfStock, lowStock, discounted] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments(buildAdminFilter({ stock: "out" }, threshold)),
    Product.countDocuments(buildAdminFilter({ stock: "low" }, threshold)),
    Product.countDocuments(buildAdminFilter({ discount: "active" }, threshold)),
  ]);

  res.status(200).json({
    success: true,
    data: {
      all,
      active,
      inactive: all - active,
      outOfStock,
      lowStock,
      discounted,
    },
  });
});

// ---------- یک محصول با شناسه (برای ویرایش؛ غیرفعال‌ها هم) ----------
export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  res.status(200).json({ success: true, data: product });
});

// ---------- پیشنهاد ویژگی‌ها و مقدارهای واریانت (از محصولات موجود) ----------
export const getAttributeSuggestions = asyncHandler(async (req, res) => {
  const rows = await Product.aggregate([
    { $unwind: "$variants" },
    { $unwind: "$variants.attributes" },
    {
      $group: {
        _id: {
          name: "$variants.attributes.name",
          value: "$variants.attributes.value",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, "_id.value": 1 } },
    {
      $group: {
        _id: "$_id.name",
        total: { $sum: "$count" },
        values: { $push: "$_id.value" },
      },
    },
    { $sort: { total: -1, _id: 1 } },
    { $limit: 30 },
    { $project: { _id: 0, name: "$_id", values: { $slice: ["$values", 40] } } },
  ]);

  res.status(200).json({ success: true, data: rows });
});

// ---------- فعال و غیرفعال‌کردن گروهی ----------
export const bulkSetActive = asyncHandler(async (req, res) => {
  const { ids, isActive } = req.body;

  const result = await Product.updateMany(
    { _id: { $in: ids } },
    { $set: { isActive } },
  );
  await logAudit(req, {
    action: "product.bulk-active",
    entityType: "product",
    summary: `${result.modifiedCount} محصول ${isActive ? "فعال" : "غیرفعال"} شد`,
  });
  res.status(200).json({
    success: true,
    data: {
      requested: ids.length,
      matched: result.matchedCount,
      updated: result.modifiedCount,
    },
  });
});

// ---------- ویرایش سریع موجودی یک واریانت ----------
export const updateVariantStock = asyncHandler(async (req, res) => {
  const { stock, expected } = req.body;
  const { id, variantId } = req.params;

  // فقط اگه موجودی هنوز همونی باشه که ادمین دیده، تغییر اعمال می‌شه (جلوگیری از بازنویسی کسر موجودیِ سفارش‌ها)
  const product = await Product.findOneAndUpdate(
    { _id: id, variants: { $elemMatch: { _id: variantId, stock: expected } } },
    { $set: { "variants.$.stock": stock } },
    { new: true },
  ).select("variants name");

  if (!product) {
    const exists = await Product.exists({ _id: id, "variants._id": variantId });
    res.status(exists ? 409 : 404);
    throw new Error(
      exists
        ? "موجودی هم‌زمان تغییر کرده است، صفحه را تازه کنید"
        : "محصول یا واریانت پیدا نشد",
    );
  }

  const variant = product.variants.id(variantId);
  await logAudit(req, {
    action: "product.stock",
    entityType: "product",
    entityId: product._id,
    entityLabel: product.name,
    summary: `موجودی «${product.name}» (${variant.attributes.map((a) => a.value).join("، ")}) از ${expected} به ${stock} تغییر کرد`,
    changes: [{ field: "stock", label: "موجودی", from: expected, to: stock }],
  });

  res.status(200).json({
    success: true,
    data: { variantId, stock: product.variants.id(variantId).stock },
  });
});

// ---------- تصاویر: افزودن و تغییر ترتیب (عکس اول، تصویر اصلی است) ----------
export const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  if (!req.files?.length) {
    res.status(400);
    throw new Error("عکسی ارسال نشد");
  }

  if (product.images.length + req.files.length > MAX_IMAGES) {
    res.status(400);
    throw new Error(`حداکثر ${MAX_IMAGES} عکس برای هر محصول مجاز است`);
  }

  product.images.push(
    ...req.files.map((file) => getFileUrl("products", file.filename)),
  );
  await product.save();

  res.status(201).json({ success: true, data: product.images });
});

export const reorderProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  const next = req.body.images;
  const valid =
    next.length === product.images.length &&
    new Set(next).size === next.length &&
    next.every((url) => product.images.includes(url));

  if (!valid) {
    res.status(400);
    throw new Error("ترتیب ارسالی با تصاویر محصول هم‌خوان نیست");
  }

  product.images = next;
  await product.save();

  res.status(200).json({ success: true, data: product.images });
});

// ---------- کپی محصول (غیرفعال، بدون عکس، با موجودی صفر) ----------
export const duplicateProduct = asyncHandler(async (req, res) => {
  const source = await Product.findById(req.params.id).lean();

  if (!source) {
    res.status(404);
    throw new Error("محصول یافت نشد");
  }

  const copy = await Product.create({
    name: `${source.name} (کپی)`.slice(0, 150),
    description: source.description,
    brand: source.brand,
    categories: source.categories,
    variants: source.variants.map((v) => ({
      attributes: v.attributes.map(({ name, value }) => ({ name, value })),
      price: v.price,
      stock: 0,
    })),
    discountPercent: source.discountPercent,
    discountStartDate: source.discountStartDate,
    discountEndDate: source.discountEndDate,
    isActive: false,
    images: [],
  });

  res
    .status(201)
    .json({ success: true, data: { _id: copy._id, slug: copy.slug } });
});

// ---------- موجودی انبار: هر واریانت یک ردیف ----------
const INVENTORY_SORTS = {
  stockAsc: { "variants.stock": 1, "variants._id": 1 },
  stockDesc: { "variants.stock": -1, "variants._id": 1 },
  valueDesc: { value: -1, "variants._id": 1 },
  nameAsc: { name: 1, "variants._id": 1 },
};

const INVENTORY_EXPORT_LIMIT = 5000;

// ارزش فقط برای موجودی مثبت حساب می‌شه (به قیمت فروش، قبل از تخفیف محصول)
const VALUE_EXPR = {
  $cond: [
    { $gt: ["$variants.stock", 0] },
    { $multiply: ["$variants.price", "$variants.stock"] },
    0,
  ],
};

// aggregate مقدارها رو cast نمی‌کنه، پس شناسه‌ها باید ObjectId باشن
const buildInventoryStages = (
  { search, status, active, category, brand } = {},
  threshold,
) => {
  const productMatch = {};
  if (active) productMatch.isActive = active === "true";
  if (category) productMatch.categories = new mongoose.Types.ObjectId(category);
  if (brand) productMatch.brand = new mongoose.Types.ObjectId(brand);

  const variantMatch = {};
  if (status === "out") variantMatch["variants.stock"] = { $lte: 0 };
  if (status === "low")
    variantMatch["variants.stock"] = { $gt: 0, $lte: threshold };
  if (status === "ok") variantMatch["variants.stock"] = { $gt: threshold };
  if (status === "negative") variantMatch["variants.stock"] = { $lt: 0 };

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    variantMatch.$or = [{ name: rx }, { "variants.sku": rx }];
  }

  return [
    ...(Object.keys(productMatch).length ? [{ $match: productMatch }] : []),
    { $unwind: "$variants" },
    ...(Object.keys(variantMatch).length ? [{ $match: variantMatch }] : []),
    { $addFields: { value: VALUE_EXPR } },
  ];
};

const stockStatusText = (stock, threshold) =>
  stock < 0
    ? "منفی"
    : stock === 0
      ? "ناموجود"
      : stock <= threshold
        ? "کم‌موجودی"
        : "موجود";

export const getInventoryList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 30,
    maxLimit: 100,
  });
  const threshold = await getLowStockThreshold();
  const sort = req.query.sort in INVENTORY_SORTS ? req.query.sort : "stockAsc";

  const aggregation = Product.aggregate([
    ...buildInventoryStages(req.query, threshold),
    {
      $facet: {
        rows: [
          { $sort: INVENTORY_SORTS[sort] },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              productId: "$_id",
              name: 1,
              slug: 1,
              image: { $arrayElemAt: ["$images", 0] },
              isActive: 1,
              variantId: "$variants._id",
              attributes: "$variants.attributes",
              sku: "$variants.sku",
              price: "$variants.price",
              stock: "$variants.stock",
              value: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (sort === "nameAsc") aggregation.collation({ locale: "fa", strength: 2 });

  const [result] = await aggregation;
  const total = result.total[0]?.count ?? 0;

  res.status(200).json({
    success: true,
    data: result.rows,
    pagination: { total, page, pages: Math.ceil(total / limit) },
    threshold,
  });
});

// ---------- خلاصه‌ی کل انبار (مستقل از فیلترها) ----------
export const getInventorySummary = asyncHandler(async (req, res) => {
  const threshold = await getLowStockThreshold();

  const [row, stockIssueOrders] = await Promise.all([
    Product.aggregate([
      { $unwind: "$variants" },
      {
        $group: {
          _id: null,
          variants: { $sum: 1 },
          units: { $sum: { $max: ["$variants.stock", 0] } },
          value: { $sum: VALUE_EXPR },
          out: { $sum: { $cond: [{ $lte: ["$variants.stock", 0] }, 1, 0] } },
          low: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$variants.stock", 0] },
                    { $lte: ["$variants.stock", threshold] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          negative: {
            $sum: { $cond: [{ $lt: ["$variants.stock", 0] }, 1, 0] },
          },
        },
      },
    ]).then((rows) => rows[0]),
    Order.countDocuments({
      stockIssue: true,
      status: { $in: ["paid", "processing"] },
    }),
  ]);

  const s = row ?? {
    variants: 0,
    units: 0,
    value: 0,
    out: 0,
    low: 0,
    negative: 0,
  };

  res.status(200).json({
    success: true,
    data: {
      threshold,
      variants: s.variants,
      units: s.units,
      value: s.value,
      out: s.out,
      low: s.low,
      negative: s.negative,
      ok: s.variants - s.out - s.low,
      stockIssueOrders,
    },
  });
});

// ---------- خروجی CSV برای انبارگردانی (با رعایت فیلترها) ----------
export const exportInventory = asyncHandler(async (req, res) => {
  const threshold = await getLowStockThreshold();
  const stages = buildInventoryStages(req.query, threshold);

  const [counted] = await Product.aggregate([...stages, { $count: "count" }]);
  const total = counted?.count ?? 0;

  if (total > INVENTORY_EXPORT_LIMIT) {
    res.status(400);
    throw new Error(
      `تعداد ردیف‌ها (${total}) بیشتر از ${INVENTORY_EXPORT_LIMIT} است؛ فیلتر را محدودتر کنید`,
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inventory-${toTehranDay(new Date())}.csv"`,
  );

  res.write("\uFEFF"); // تا Excel فارسی رو درست نشون بده
  res.write(
    csvRow([
      "محصول",
      "ویژگی‌ها",
      "SKU",
      "قیمت فروش (تومان)",
      "موجودی سیستم",
      "ارزش موجودی (تومان)",
      "وضعیت موجودی",
      "وضعیت محصول",
      "موجودی شمارش‌شده",
    ]),
  );

  const cursor = Product.aggregate([
    ...stages,
    { $sort: { name: 1, "variants._id": 1 } },
  ])
    .collation({ locale: "fa", strength: 2 })
    .cursor();

  for await (const row of cursor) {
    const v = row.variants;
    res.write(
      csvRow([
        row.name,
        v.attributes.map((a) => `${a.name}: ${a.value}`).join("، "),
        v.sku,
        v.price,
        v.stock,
        row.value,
        stockStatusText(v.stock, threshold),
        row.isActive ? "فعال" : "غیرفعال",
        "", 
      ]),
    );
  }

  res.end();
});
