import asyncHandler from "express-async-handler";
import User from "./UserMd.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";

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
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const filter = { role: "user" };
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ phone: rx }, { name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-otpCode -otpExpires")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: users,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// ---------- فعال/غیرفعال (بلاک) کردن کاربر (ادمین) ----------
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

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isBlocked ? "کاربر بلاک شد" : "کاربر از بلاک خارج شد",
    data: { id: user._id, isBlocked: user.isBlocked },
  });
});
