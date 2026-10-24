import crypto from "crypto";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Modules/User/UserMd.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    res.status(401);
    throw new Error("توکن ارسال نشده، دسترسی غیرمجاز");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    res.status(401);
    throw new Error("توکن نامعتبر یا منقضی شده");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(401);
    throw new Error("کاربر یافت نشد");
  }

  if (!decoded.id || decoded.purpose) {
    res.status(401);
    throw new Error("توکن نامعتبر است");
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error("حساب کاربری شما مسدود شده است");
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("شما اجازه دسترسی به این بخش را ندارید");
    }
    next();
  };

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export const verifyAdminSecret = (req, res, next) => {
  const secret = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_CREATION_SECRET;

  if (!expected || !secret || !safeEqual(secret, expected)) {
    res.status(403);
    throw new Error("دسترسی غیرمجاز");
  }

  next();
};
