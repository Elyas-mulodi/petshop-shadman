import asyncHandler from "express-async-handler";
import User from "./UserMd.js";

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
    data: { id: user._id, phone: user.phone, name: user.name, email: user.email },
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

  res.status(200).json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
});