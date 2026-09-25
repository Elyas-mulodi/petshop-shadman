import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../Order/OrderMd.js";
import Product from "../Product/ProductMd.js";
import User from "../User/UserMd.js";

// وضعیت‌هایی که به‌عنوان فروش واقعی/موفق حساب میشن (نه پرداخت‌نشده/لغوشده)
const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];

// تعیین بازه پیش‌فرض (۳۰ روز اخیر) اگه ادمین تاریخ نداده باشه
const resolveDateRange = (fromQuery, toQuery) => {
  const to = toQuery ? new Date(toQuery) : new Date();
  const from = fromQuery
    ? new Date(fromQuery)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  // تا آخر روزِ "to" رو هم پوشش بده
  to.setHours(23, 59, 59, 999);

  return { from, to };
};

// تشخیص گرانولاریتی نمودار: اگه بازه بیشتر از ۳۱ روز بود، ماهانه؛ وگرنه روزانه
const getDateFormat = (from, to) => {
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  return diffDays > 31 ? "%Y-%m" : "%Y-%m-%d";
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { from: fromQuery, to: toQuery } = req.query;
  const { from, to } = resolveDateRange(fromQuery, toQuery);
  const dateFormat = getDateFormat(from, to);

  const matchStage = {
    status: { $in: REVENUE_STATUSES },
    createdAt: { $gte: from, $lte: to },
  };

  // ---------- خلاصه فروش + نمودار زمانی ----------
  const salesChart = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
  ]);

  const totals = salesChart.reduce(
    (acc, day) => {
      acc.totalRevenue += day.revenue;
      acc.totalOrders += day.orders;
      return acc;
    },
    { totalRevenue: 0, totalOrders: 0 }
  );

  // ---------- کاربران ----------
  const [totalUsers, newUsers] = await Promise.all([
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isVerified: true, createdAt: { $gte: from, $lte: to } }),
  ]);

  // ---------- محصولات پرفروش ----------
  const topProducts = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        image: { $first: "$items.image" },
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: 5 },
  ]);

  // ---------- هشدار موجودی کم ----------
  const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);

  const lowStockProducts = await Product.aggregate([
    { $match: { isActive: true } },
    { $unwind: "$variants" },
    { $match: { "variants.stock": { $lte: lowStockThreshold } } },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: "$name",
        variantId: "$variants._id",
        attributes: "$variants.attributes",
        stock: "$variants.stock",
      },
    },
    { $sort: { stock: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      dateRange: { from, to },
      totalRevenue: totals.totalRevenue,
      totalOrders: totals.totalOrders,
      totalUsers,
      newUsers,
      salesChart,
      topProducts,
      lowStockProducts,
      lowStockThreshold,
    },
  });
});