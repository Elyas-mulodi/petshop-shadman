import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../User/UserMd.js";
import generateOtp from "../../Utils/generateOtp.js";
import sendSms from "../../Utils/sendSms.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../../Utils/generateToken.js";

const OTP_EXPIRE_MINUTES = 2;
const TEMP_TOKEN_EXPIRE = "5m";

// ---------- ثبت‌نام: مرحله ۱ - ارسال OTP ----------
export const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  let user = await User.findOne({ phone });

  if (user && user.isVerified) {
    res.status(400);
    throw new Error("این شماره قبلاً ثبت‌نام کرده است");
  }

  const otpCode = generateOtp();
  const otpExpires = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

  if (!user) {
    user = new User({ phone });
  }

  user.otpCode = otpCode;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  await sendSms(phone, `کد تایید پت شاپ شادمان: ${otpCode}`);

  res.status(200).json({ success: true, message: "کد تایید ارسال شد" });
});

// ---------- ثبت‌نام: مرحله ۲ - تایید OTP ----------
export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone }).select("+otpCode +otpExpires");

  if (!user || !user.otpCode) {
    res.status(400);
    throw new Error("درخواستی برای این شماره یافت نشد");
  }

  if (user.otpExpires < new Date()) {
    res.status(400);
    throw new Error("کد تایید منقضی شده است");
  }

  if (user.otpCode !== otp) {
    res.status(400);
    throw new Error("کد تایید نادرست است");
  }

  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const registrationToken = jwt.sign(
    { phone, purpose: "register" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: TEMP_TOKEN_EXPIRE },
  );

  res.status(200).json({
    success: true,
    message: "شماره موبایل تایید شد",
    registrationToken,
  });
});

// ---------- ثبت‌نام: مرحله ۳ - تنظیم رمز عبور ----------
export const setRegisterPassword = asyncHandler(async (req, res) => {
  const { registrationToken, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(registrationToken, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("توکن ثبت‌نام نامعتبر یا منقضی شده است");
  }

  if (decoded.purpose !== "register") {
    res.status(401);
    throw new Error("توکن نامعتبر است");
  }

  const user = await User.findOne({ phone: decoded.phone });

  if (!user) {
    res.status(404);
    throw new Error("کاربر یافت نشد");
  }

  user.password = password;
  user.isVerified = true;
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: "ثبت‌نام با موفقیت انجام شد",
    accessToken,
    user: { id: user._id, phone: user.phone, role: user.role },
  });
});

// ---------- ورود ----------
export const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone }).select("+password");

  if (!user || !user.isVerified) {
    res.status(401);
    throw new Error("شماره موبایل یا رمز عبور اشتباه است");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("شماره موبایل یا رمز عبور اشتباه است");
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error(
      "حساب کاربری شما مسدود شده است، برای اطلاعات بیشتر با پشتیبانی تماس بگیرید",
    );
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    accessToken,
    user: { id: user._id, phone: user.phone, role: user.role },
  });
});

// ---------- دریافت access token جدید از روی refresh token ----------
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("توکن یافت نشد، لطفاً دوباره وارد شوید");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("توکن نامعتبر یا منقضی شده است");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error("کاربر یافت نشد");
  }

  const accessToken = generateAccessToken(user._id);

  res.status(200).json({ success: true, accessToken });
});

// ---------- خروج ----------
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "خروج با موفقیت انجام شد" });
});

// ---------- فراموشی رمز عبور: مرحله ۱ - ارسال OTP ----------
export const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone, isVerified: true });

  if (!user) {
    res.status(404);
    throw new Error("کاربری با این شماره یافت نشد");
  }

  const otpCode = generateOtp();
  const otpExpires = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

  user.otpCode = otpCode;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  await sendSms(phone, `کد بازیابی رمز عبور پت شاپ شادمان: ${otpCode}`);

  res.status(200).json({ success: true, message: "کد تایید ارسال شد" });
});

// ---------- فراموشی رمز عبور: مرحله ۲ - تایید OTP ----------
export const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone }).select("+otpCode +otpExpires");

  if (!user || !user.otpCode) {
    res.status(400);
    throw new Error("درخواستی برای این شماره یافت نشد");
  }

  if (user.otpExpires < new Date()) {
    res.status(400);
    throw new Error("کد تایید منقضی شده است");
  }

  if (user.otpCode !== otp) {
    res.status(400);
    throw new Error("کد تایید نادرست است");
  }

  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const resetToken = jwt.sign(
    { phone, purpose: "reset" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: TEMP_TOKEN_EXPIRE },
  );

  res.status(200).json({ success: true, resetToken });
});

// ---------- فراموشی رمز عبور: مرحله ۳ - تنظیم رمز جدید ----------
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("توکن بازیابی نامعتبر یا منقضی شده است");
  }

  if (decoded.purpose !== "reset") {
    res.status(401);
    throw new Error("توکن نامعتبر است");
  }

  const user = await User.findOne({ phone: decoded.phone });

  if (!user) {
    res.status(404);
    throw new Error("کاربر یافت نشد");
  }

  user.password = password;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "رمز عبور با موفقیت تغییر کرد" });
});

// ---------- ساخت ادمین اولیه (محافظت‌شده با Secret Key) ----------
export const createAdmin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    res.status(400);
    throw new Error("کاربری با این شماره از قبل وجود دارد");
  }

  const admin = await User.create({
    phone,
    password,
    role: "admin",
    isVerified: true,
  });

  res.status(201).json({
    success: true,
    message: "ادمین با موفقیت ساخته شد",
    user: { id: admin._id, phone: admin.phone, role: admin.role },
  });
});
