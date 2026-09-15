import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Modules/User/UserMd.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("توکن ارسال نشده، دسترسی غیرمجاز");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      res.status(401);
      throw new Error("کاربر یافت نشد");
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("توکن نامعتبر یا منقضی شده");
  }
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error("شما اجازه دسترسی به این بخش را ندارید");
  }
  next();
};

export const verifyAdminSecret = (req, res, next) => {
  const secret = req.headers["x-admin-secret"];

  if (!secret || secret !== process.env.ADMIN_CREATION_SECRET) {
    res.status(403);
    throw new Error("دسترسی غیرمجاز");
  }

  next();
};