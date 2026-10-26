import asyncHandler from "express-async-handler";
import Order from "../Order/OrderMd.js";
import Product from "../Product/ProductMd.js";
import User from "../User/UserMd.js";
import Category from "../Category/CategoryMd.js";
import Brand from "../Brand/BrandMd.js";
import {
  TEHRAN_TZ,
  bucketize,
  listDays,
  pickGranularity,
  resolveRange,
} from "../../Utils/dateRange.js";

// وضعیت‌هایی که فروش واقعی حساب می‌شن
const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];
const STATUS_ORDER = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "expired",
];
const WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
const MONGO_DOW_FOR_WEEKDAYS = [7, 1, 2, 3, 4, 5, 6]; // ۱=یکشنبه ... ۷=شنبه در Mongo

const lowStockThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD || 5);

const query = (req) => req.validatedQuery ?? {};
const rangeOf = (req) => resolveRange(query(req));
const limitOf = (req, fallback, max) =>
  Math.min(max, Math.max(1, parseInt(query(req).limit, 10) || fallback));

const paidMatch = (from, to) => ({
  status: { $in: REVENUE_STATUSES },
  "payment.paidAt": { $gte: from, $lte: to },
});

const dayKey = (field) => ({
  $dateToString: { format: "%Y-%m-%d", date: field, timezone: TEHRAN_TZ },
});

const delta = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : null; // null یعنی بازه‌ی قبلی مبنا نداره
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const metric = (current, previous) => ({
  value: current,
  previous,
  delta: delta(current, previous),
});

const rangeInfo = (r) => ({
  from: r.fromDay,
  to: r.toDay,
  days: r.days,
  previous: { from: r.previous.fromDay, to: r.previous.toDay },
});

// ---------- محاسبه‌های مشترک ----------
const salesTotals = async (from, to) => {
  const [row] = await Order.aggregate([
    { $match: paidMatch(from, to) },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
        discount: { $sum: "$discountAmount" },
        itemsSold: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);
  return row ?? { revenue: 0, orders: 0, discount: 0, itemsSold: 0 };
};

// لغو یا مرجوعیِ سفارش‌هایی که پولشون گرفته شده بود؛ باید دستی از درگاه عودت بشن
const refundTotals = async (from, to) => {
  const [row] = await Order.aggregate([
    {
      $match: {
        status: { $in: ["cancelled", "returned"] },
        "payment.paidAt": { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        amount: { $sum: "$totalAmount" },
      },
    },
  ]);
  return { count: row?.count ?? 0, amount: row?.amount ?? 0 };
};

const newUsersCount = (from, to) =>
  User.countDocuments({
    role: "user",
    isVerified: true,
    createdAt: { $gte: from, $lte: to },
  });

const stockSummary = async (threshold) => {
  const [row] = await Product.aggregate([
    { $match: { isActive: true } },
    { $unwind: "$variants" },
    {
      $group: {
        _id: null,
        outOfStock: {
          $sum: { $cond: [{ $lte: ["$variants.stock", 0] }, 1, 0] },
        },
        lowStock: {
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
      },
    },
  ]);
  return { outOfStock: row?.outOfStock ?? 0, lowStock: row?.lowStock ?? 0 };
};

// ---------- ۱) نمای کلی: شاخص‌ها + وضعیت لحظه‌ای ----------
export const getOverview = asyncHandler(async (req, res) => {
  const r = rangeOf(req);
  const now = new Date();
  const threshold = lowStockThreshold();

  const [
    cur,
    prev,
    refunds,
    newUsers,
    prevNewUsers,
    totalUsers,
    pendingPayment,
    awaitingShipment,
    stockIssue,
    stock,
  ] = await Promise.all([
    salesTotals(r.from, r.to),
    salesTotals(r.previous.from, r.previous.to),
    refundTotals(r.from, r.to),
    newUsersCount(r.from, r.to),
    newUsersCount(r.previous.from, r.previous.to),
    User.countDocuments({ role: "user", isVerified: true }),
    Order.countDocuments({
      status: "pending_payment",
      expiresAt: { $gte: now },
    }),
    Order.countDocuments({ status: { $in: ["paid", "processing"] } }),
    Order.countDocuments({
      stockIssue: true,
      status: { $in: ["paid", "processing"] },
    }),
    stockSummary(threshold),
  ]);

  const aov = (row) => (row.orders ? Math.round(row.revenue / row.orders) : 0);

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      kpis: {
        revenue: metric(cur.revenue, prev.revenue),
        orders: metric(cur.orders, prev.orders),
        aov: metric(aov(cur), aov(prev)),
        newUsers: metric(newUsers, prevNewUsers),
        discount: metric(cur.discount, prev.discount),
        itemsSold: metric(cur.itemsSold, prev.itemsSold),
      },
      refunds,
      live: {
        totalUsers,
        pendingPayment,
        awaitingShipment,
        stockIssue,
        lowStock: stock.lowStock,
        outOfStock: stock.outOfStock,
        lowStockThreshold: threshold,
      },
    },
  });
});

// ---------- ۲) روند فروش ----------
export const getSales = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const rows = await Order.aggregate([
    { $match: paidMatch(r.from, r.to) },
    {
      $group: {
        _id: dayKey("$payment.paidAt"),
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
  ]);

  const byDay = new Map(rows.map((row) => [row._id, row]));
  const daily = listDays(r.fromDay, r.toDay).map((date) => ({
    date,
    revenue: byDay.get(date)?.revenue ?? 0,
    orders: byDay.get(date)?.orders ?? 0,
  }));

  const granularity = pickGranularity(query(req).granularity, daily.length);
  const points = bucketize(daily, granularity, ["revenue", "orders"]).map(
    (p) => ({
      ...p,
      aov: p.orders ? Math.round(p.revenue / p.orders) : 0,
    }),
  );

  res
    .status(200)
    .json({
      success: true,
      data: { range: rangeInfo(r), granularity, points },
    });
});

// ---------- ۳) توزیع وضعیت سفارش‌ها (سفارش‌های ثبت‌شده در بازه) ----------
export const getStatusBreakdown = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: r.from, $lte: r.to } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const byStatus = new Map(rows.map((row) => [row._id, row]));
  const items = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus.get(status)?.count ?? 0,
    amount: byStatus.get(status)?.amount ?? 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      total: items.reduce((sum, i) => sum + i.count, 0),
      items,
    },
  });
});

// ---------- ۴) پرفروش‌ترین محصولات ----------
export const getTopProducts = asyncHandler(async (req, res) => {
  const r = rangeOf(req);
  const sortField = query(req).metric === "quantity" ? "quantity" : "revenue";
  const limit = limitOf(req, 8, 20);

  const items = await Order.aggregate([
    { $match: paidMatch(r.from, r.to) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.productName" },
        image: { $first: "$items.image" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { [sortField]: -1, _id: 1 } },
    { $limit: limit },
  ]);

  res
    .status(200)
    .json({
      success: true,
      data: { range: rangeInfo(r), metric: sortField, items },
    });
});

// ---------- ۵) فروش به تفکیک دسته‌بندی و برند ----------
// مبلغ فروش کالا (قبل از تخفیف سطح سفارش و بدون هزینه‌ی ارسال)
const productLookup = [
  { $match: null }, // جایگزین می‌شه
  { $unwind: "$items" },
  {
    $lookup: {
      from: Product.collection.name,
      localField: "items.product",
      foreignField: "_id",
      as: "p",
    },
  },
  { $unwind: "$p" },
];

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const items = await Order.aggregate([
    ...productLookup.map((stage, i) =>
      i === 0 ? { $match: paidMatch(r.from, r.to) } : stage,
    ),
    {
      $lookup: {
        from: Category.collection.name,
        localField: "p.categories",
        foreignField: "_id",
        as: "cats",
      },
    },
    // محصول هم به دسته‌ی والد و هم زیردسته وصله؛ فقط زیردسته‌ها شمرده می‌شن تا مبلغ دوبار حساب نشه
    {
      $addFields: {
        leaf: {
          $let: {
            vars: {
              children: {
                $filter: {
                  input: "$cats",
                  as: "c",
                  cond: { $ne: [{ $ifNull: ["$$c.parent", null] }, null] },
                },
              },
            },
            in: {
              $cond: [
                { $gt: [{ $size: "$$children" }, 0] },
                "$$children",
                "$cats",
              ],
            },
          },
        },
      },
    },
    { $match: { "leaf.0": { $exists: true } } },
    // اگه محصول چند زیردسته داشت، مبلغ مساوی بینشون تقسیم می‌شه
    {
      $addFields: {
        share: { $divide: ["$items.lineTotal", { $size: "$leaf" }] },
        qtyShare: { $divide: ["$items.quantity", { $size: "$leaf" }] },
      },
    },
    { $unwind: "$leaf" },
    {
      $group: {
        _id: "$leaf._id",
        name: { $first: "$leaf.name" },
        revenue: { $sum: "$share" },
        quantity: { $sum: "$qtyShare" },
      },
    },
    {
      $project: {
        name: 1,
        revenue: { $round: ["$revenue", 0] },
        quantity: { $round: ["$quantity", 0] },
      },
    },
    { $sort: { revenue: -1, _id: 1 } },
  ]);

  res.status(200).json({ success: true, data: { range: rangeInfo(r), items } });
});

export const getBrandBreakdown = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const items = await Order.aggregate([
    ...productLookup.map((stage, i) =>
      i === 0 ? { $match: paidMatch(r.from, r.to) } : stage,
    ),
    {
      $lookup: {
        from: Brand.collection.name,
        localField: "p.brand",
        foreignField: "_id",
        as: "b",
      },
    },
    { $unwind: "$b" },
    {
      $group: {
        _id: "$b._id",
        name: { $first: "$b.name" },
        revenue: { $sum: "$items.lineTotal" },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1, _id: 1 } },
  ]);

  res.status(200).json({ success: true, data: { range: rangeInfo(r), items } });
});

// ---------- ۶) مشتریان: خریدار جدید در برابر تکراری + ثبت‌نام‌ها ----------
export const getCustomers = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const [buyersRow, registrationRows, totalUsers] = await Promise.all([
    // «خریدار جدید» یعنی اولین پرداخت موفقش توی همین بازه بوده
    Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          "payment.paidAt": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$user",
          firstPaidAt: { $min: "$payment.paidAt" },
          ordersInRange: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$payment.paidAt", r.from] },
                    { $lte: ["$payment.paidAt", r.to] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $match: { ordersInRange: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          buyers: { $sum: 1 },
          newBuyers: {
            $sum: { $cond: [{ $gte: ["$firstPaidAt", r.from] }, 1, 0] },
          },
          orders: { $sum: "$ordersInRange" },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          role: "user",
          isVerified: true,
          createdAt: { $gte: r.from, $lte: r.to },
        },
      },
      { $group: { _id: dayKey("$createdAt"), count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "user", isVerified: true }),
  ]);

  const row = buyersRow[0] ?? { buyers: 0, newBuyers: 0, orders: 0 };

  const byDay = new Map(registrationRows.map((x) => [x._id, x.count]));
  const daily = listDays(r.fromDay, r.toDay).map((date) => ({
    date,
    count: byDay.get(date) ?? 0,
  }));
  const granularity = pickGranularity(query(req).granularity, daily.length);

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      totalUsers,
      buyers: row.buyers,
      newBuyers: row.newBuyers,
      returningBuyers: row.buyers - row.newBuyers,
      ordersPerBuyer: row.buyers
        ? Math.round((row.orders / row.buyers) * 10) / 10
        : 0,
      registrations: {
        granularity,
        points: bucketize(daily, granularity, ["count"]),
      },
    },
  });
});

// ---------- ۷) هزینه‌ی تخفیف‌ها ----------
export const getDiscounts = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const [bySource, topCoupons] = await Promise.all([
    Order.aggregate([
      { $match: paidMatch(r.from, r.to) },
      {
        $group: {
          _id: { $ifNull: ["$discountSource", "none"] },
          orders: { $sum: 1 },
          amount: { $sum: "$discountAmount" },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...paidMatch(r.from, r.to), couponCode: { $ne: null } } },
      {
        $group: {
          _id: "$couponCode",
          orders: { $sum: 1 },
          amount: { $sum: "$discountAmount" },
        },
      },
      { $sort: { orders: -1, _id: 1 } },
      { $limit: 5 },
    ]),
  ]);

  const pick = (source) => {
    const row = bySource.find((x) => x._id === source);
    return {
      orders: row?.orders ?? 0,
      amount: row?.amount ?? 0,
      revenue: row?.revenue ?? 0,
    };
  };

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      coupon: pick("coupon"),
      loyalty: pick("loyalty"),
      none: pick("none"),
      topCoupons: topCoupons.map((c) => ({
        code: c._id,
        orders: c.orders,
        amount: c.amount,
      })),
    },
  });
});

// ---------- ۸) قیف پرداخت و رها شدن ----------
export const getFunnel = asyncHandler(async (req, res) => {
  const r = rangeOf(req);
  const now = new Date();
  const unpaid = { $eq: [{ $ifNull: ["$payment.paidAt", null] }, null] };

  const [row] = await Order.aggregate([
    { $match: { createdAt: { $gte: r.from, $lte: r.to } } },
    {
      $group: {
        _id: null,
        created: { $sum: 1 },
        paid: { $sum: { $cond: [{ $not: [unpaid] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
        cancelledUnpaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "cancelled"] }, unpaid] },
              1,
              0,
            ],
          },
        },
        stalePending: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "pending_payment"] },
                  { $lt: ["$expiresAt", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        pending: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "pending_payment"] },
                  { $gte: ["$expiresAt", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const f = row ?? {
    created: 0,
    paid: 0,
    expired: 0,
    cancelledUnpaid: 0,
    stalePending: 0,
    pending: 0,
  };
  const abandoned = f.expired + f.cancelledUnpaid + f.stalePending;

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      created: f.created,
      paid: f.paid,
      abandoned,
      pending: f.pending,
      // سفارش‌هایی که هنوز فرصت پرداخت دارن توی نرخ حساب نمی‌شن
      conversionRate:
        f.created - f.pending > 0
          ? Math.round((f.paid / (f.created - f.pending)) * 1000) / 10
          : 0,
    },
  });
});

// ---------- ۹) الگوی فروش: ساعت روز و روز هفته ----------
export const getPatterns = asyncHandler(async (req, res) => {
  const r = rangeOf(req);

  const [facets] = await Order.aggregate([
    { $match: paidMatch(r.from, r.to) },
    {
      $project: {
        hour: { $hour: { date: "$payment.paidAt", timezone: TEHRAN_TZ } },
        dow: { $dayOfWeek: { date: "$payment.paidAt", timezone: TEHRAN_TZ } },
        totalAmount: 1,
      },
    },
    {
      $facet: {
        hours: [
          {
            $group: {
              _id: "$hour",
              orders: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
        ],
        weekdays: [
          {
            $group: {
              _id: "$dow",
              orders: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
        ],
      },
    },
  ]);

  const hourMap = new Map((facets?.hours ?? []).map((x) => [x._id, x]));
  const dowMap = new Map((facets?.weekdays ?? []).map((x) => [x._id, x]));

  res.status(200).json({
    success: true,
    data: {
      range: rangeInfo(r),
      hours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: hourMap.get(hour)?.orders ?? 0,
        revenue: hourMap.get(hour)?.revenue ?? 0,
      })),
      weekdays: MONGO_DOW_FOR_WEEKDAYS.map((dow, i) => ({
        label: WEEKDAYS[i],
        orders: dowMap.get(dow)?.orders ?? 0,
        revenue: dowMap.get(dow)?.revenue ?? 0,
      })),
    },
  });
});

// ---------- ۱۰) فروش به تفکیک استان ----------
export const getGeo = asyncHandler(async (req, res) => {
  const r = rangeOf(req);
  const limit = limitOf(req, 10, 31);

  const items = await Order.aggregate([
    { $match: paidMatch(r.from, r.to) },
    {
      $group: {
        _id: "$shippingAddress.province",
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { revenue: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, province: "$_id", orders: 1, revenue: 1 } },
  ]);

  res.status(200).json({ success: true, data: { range: rangeInfo(r), items } });
});

// ---------- ۱۱) موجودی ----------
export const getInventory = asyncHandler(async (req, res) => {
  const threshold = lowStockThreshold();

  const [summary, items] = await Promise.all([
    stockSummary(threshold),
    Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$variants" },
      { $match: { "variants.stock": { $lte: threshold } } },
      { $sort: { "variants.stock": 1, _id: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          slug: 1,
          variantId: "$variants._id",
          attributes: "$variants.attributes",
          stock: "$variants.stock",
        },
      },
    ]),
  ]);

  res
    .status(200)
    .json({ success: true, data: { threshold, ...summary, items } });
});

// ---------- ۱۲) آخرین سفارش‌ها ----------
export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ status: { $ne: "expired" } })
    .select(
      "orderNumber user status totalAmount createdAt shippingAddress.fullName stockIssue",
    )
    .populate("user", "phone name")
    .sort({ createdAt: -1, _id: -1 })
    .limit(8)
    .lean();

  res.status(200).json({ success: true, data: orders });
});
