import asyncHandler from "express-async-handler";
import User from "./UserMd.js";
import Order from "../Order/OrderMd.js";
import Coupon from "../Coupon/CouponMd.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";
import { logAudit } from "../../Utils/audit.js";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];
const USER_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  nameAsc: { name: 1, _id: 1 },
};

// تعریف وضعیت‌ها: فعال = تاییدشده و غیرمسدود
const statusFilter = (status) => {
  if (status === "active") return { isVerified: true, isBlocked: false };
  if (status === "blocked") return { isBlocked: true };
  if (status === "unverified") return { isVerified: false };
  return {};
};

// ---------- دریافت پروفایل کاربر لاگین‌کرده ----------
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      pendingLoyaltyDiscount: user.pendingLoyaltyDiscount,
      createdAt: user.createdAt,
    },
  });
});

// ---------- ویرایش پروفایل (اسم و ایمیل) ----------
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (email) {
    const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailTaken) {
      res.status(409);
      throw new Error("این ایمیل قبلاً توسط کاربر دیگری استفاده شده است");
    }
    user.email = email;
  }

  if (name !== undefined) user.name = name;

  await user.save();

  res.status(200).json({
    success: true,
    message: "پروفایل با موفقیت به‌روزرسانی شد",
    data: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
    },
  });
});

// ---------- تغییر رمز عبور ----------
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    res.status(401);
    throw new Error("رمز عبور فعلی اشتباه است");
  }

  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
});

// ---------- لیست/جستجوی کاربران (ادمین) ----------
// ---------- لیست مشتری‌ها با آمار خرید (ادمین) ----------
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, status, sort } = req.query;
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const filter = { role: "user", ...statusFilter(status) };

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ phone: rx }, { name: rx }, { email: rx }];
  }

  let query = User.find(filter)
    .sort(USER_SORTS[sort] ?? USER_SORTS.newest)
    .skip(skip)
    .limit(limit)
    .lean();
  if (sort === "nameAsc")
    query = query.collation({ locale: "fa", strength: 2 });

  const [users, total] = await Promise.all([
    query,
    User.countDocuments(filter),
  ]);

  const stats = users.length
    ? await Order.aggregate([
        {
          $match: {
            user: { $in: users.map((u) => u._id) },
            status: { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: "$user",
            orders: { $sum: 1 },
            spent: { $sum: "$totalAmount" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
      ])
    : [];
  const byUser = new Map(stats.map((s) => [String(s._id), s]));

  res.status(200).json({
    success: true,
    data: users.map((u) => {
      const s = byUser.get(String(u._id));
      return {
        ...u,
        stats: {
          orders: s?.orders ?? 0,
          spent: s?.spent ?? 0,
          lastOrderAt: s?.lastOrderAt ?? null,
        },
      };
    }),
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// ---------- شمارنده‌ی تب‌ها ----------
export const getUserCounts = asyncHandler(async (req, res) => {
  const count = (status) =>
    User.countDocuments({ role: "user", ...statusFilter(status) });

  const [all, active, blocked, unverified] = await Promise.all([
    count(undefined),
    count("active"),
    count("blocked"),
    count("unverified"),
  ]);

  res
    .status(200)
    .json({ success: true, data: { all, active, blocked, unverified } });
});

// ---------- برترین مشتری‌ها بر اساس مجموع خرید موفق ----------
export const getTopCustomers = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { status: { $in: REVENUE_STATUSES } } },
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
        spent: { $sum: "$totalAmount" },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
    { $sort: { spent: -1, _id: 1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: User.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$user.name",
        phone: "$user.phone",
        orders: 1,
        spent: 1,
        lastOrderAt: 1,
      },
    },
  ]);

  res.status(200).json({ success: true, data: rows });
});

// ---------- جزئیات یک مشتری (ادمین) ----------
export const getAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("+adminNotes +blockedReason")
    .populate("adminNotes.by", "name phone")
    .lean();

  if (!user || user.role !== "user") {
    res.status(404);
    throw new Error("کاربر یافت نشد");
  }

  const [statsRows, recentOrders, addresses, coupons] = await Promise.all([
    Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: { $cond: [{ $in: ["$status", REVENUE_STATUSES] }, 1, 0] },
          },
          spent: {
            $sum: {
              $cond: [
                { $in: ["$status", REVENUE_STATUSES] },
                "$totalAmount",
                0,
              ],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $in: ["$status", ["cancelled", "returned"]] }, 1, 0],
            },
          },
          firstOrderAt: { $min: "$createdAt" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]),
    Order.find({ user: user._id, status: { $ne: "expired" } })
      .select("orderNumber status totalAmount createdAt items.quantity")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    // آدرس‌هایی که این مشتری توی سفارش‌هاش وارد کرده (آخرین استفاده اول)
    Order.aggregate([
      { $match: { user: user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            province: "$shippingAddress.province",
            city: "$shippingAddress.city",
            addressLine: "$shippingAddress.addressLine",
            postalCode: "$shippingAddress.postalCode",
          },
          fullName: { $first: "$shippingAddress.fullName" },
          phone: { $first: "$shippingAddress.phone" },
          lastUsedAt: { $max: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { lastUsedAt: -1 } },
      { $limit: 5 },
    ]),
    Coupon.find({ usedBy: user._id }).select("code").lean(),
  ]);

  const s = statsRows[0];

  res.status(200).json({
    success: true,
    data: {
      user,
      stats: {
        totalOrders: s?.totalOrders ?? 0,
        paidOrders: s?.paidOrders ?? 0,
        spent: s?.spent ?? 0,
        average: s?.paidOrders ? Math.round(s.spent / s.paidOrders) : 0,
        cancelled: s?.cancelled ?? 0,
        firstOrderAt: s?.firstOrderAt ?? null,
        lastOrderAt: s?.lastOrderAt ?? null,
      },
      recentOrders,
      addresses: addresses.map((a) => ({
        ...a._id,
        fullName: a.fullName,
        phone: a.phone,
        lastUsedAt: a.lastUsedAt,
        count: a.count,
      })),
      coupons: coupons.map((c) => c.code),
    },
  });
});

// ---------- مسدود و آزاد کردن (با دلیل اختیاری) ----------
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("کاربر یافت نشد");
  }

  if (user.role === "admin") {
    res.status(400);
    throw new Error("امکان بلاک کردن حساب ادمین وجود ندارد");
  }

  const reason = req.body?.reason?.trim() || null;

  user.isBlocked = !user.isBlocked;
  user.blockedAt = user.isBlocked ? new Date() : null;
  user.blockedReason = user.isBlocked ? reason : null;
  await user.save();

  await logAudit(req, {
    action: "user.block",
    entityType: "user",
    entityId: user._id,
    entityLabel: user.phone,
    summary: user.isBlocked
      ? `کاربر ${user.phone} مسدود شد${reason ? `: ${reason}` : ""}`
      : `کاربر ${user.phone} از حالت مسدود خارج شد`,
  });

  res.status(200).json({
    success: true,
    message: user.isBlocked ? "کاربر بلاک شد" : "کاربر از بلاک خارج شد",
    data: { id: user._id, isBlocked: user.isBlocked },
  });
});

// ---------- یادداشت داخلی (فقط اضافه می‌شه) ----------
export const addUserNote = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: "user" },
    {
      $push: {
        adminNotes: { text: req.body.text, by: req.user._id, at: new Date() },
      },
    },
    { new: true, runValidators: true },
  )
    .select("+adminNotes phone")
    .populate("adminNotes.by", "name phone")
    .lean();

  if (!user) {
    res.status(404);
    throw new Error("کاربر یافت نشد");
  }

  await logAudit(req, {
    action: "user.note",
    entityType: "user",
    entityId: user._id,
    entityLabel: user.phone,
    summary: `یادداشت داخلی برای کاربر ${user.phone} ثبت شد`,
  });

  res.status(201).json({ success: true, data: user.adminNotes });
});
