import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { notFound, errorHandler } from "./Middlewares/errorHandler.js";
import authRoutes from "./Modules/Auth/Auth.js";
import categoryRoutes from "./Modules/Category/Category.js";
import brandRoutes from "./Modules/Brand/Brand.js";
import productRoutes from "./Modules/Product/Product.js";
import couponRoutes from "./Modules/Coupon/Coupon.js";
import loyaltyTierRoutes from "./Modules/LoyaltyTier/LoyaltyTier.js";
import cartRoutes from "./Modules/Cart/Cart.js";
import orderRoutes from "./Modules/Order/Order.js";
import userRoutes from "./Modules/User/User.js";
import dashboardRoutes from "./Modules/Dashboard/Dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";

const app = express();

// پشت یک reverse proxy (nginx / Cloudflare) مقدار TRUST_PROXY=1 بذار
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));

// ---------- Global Middlewares ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

if (isDev) {
  app.use(morgan("dev"));
}

// ---------- Rate Limiting ----------
const tooMany = (message) => ({ success: false, message });
const FIFTEEN_MIN = 15 * 60 * 1000;

const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("تعداد درخواست‌ها زیاد است، کمی بعد دوباره تلاش کنید"),
});
app.use(globalLimiter);

// کلید محدودکننده: شماره موبایل (اگه توی بدنه بود)، وگرنه IP
const phoneKey = (req) =>
  req.body?.phone ? `phone:${req.body.phone}` : ipKeyGenerator(req.ip ?? "");

const otpPhoneLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 5,
  keyGenerator: phoneKey,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany(
    "درخواست کد برای این شماره زیاد بوده است، ۱۵ دقیقه دیگر دوباره تلاش کنید",
  ),
});

const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany(
    "درخواست کد از این شبکه زیاد بوده است، کمی بعد دوباره تلاش کنید",
  ),
});

const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  keyGenerator: phoneKey,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany(
    "تعداد تلاش‌های ورود زیاد بوده است، ۱۵ دقیقه دیگر دوباره تلاش کنید",
  ),
});
const verifyOtpLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  keyGenerator: phoneKey,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("تعداد تلاش‌های واردکردن کد زیاد بوده است، ۱۵ دقیقه دیگر دوباره تلاش کنید"),
});

const cartPreviewLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 100,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("تعداد درخواست‌ها زیاد است، کمی بعد دوباره تلاش کنید"),
});

app.use("/api/cart/preview", cartPreviewLimiter);

app.use(
  ["/api/auth/register/verify-otp", "/api/auth/forgot-password/verify-otp"],
  verifyOtpLimiter,
);

app.use(
  ["/api/auth/register/send-otp", "/api/auth/forgot-password/send-otp"],
  otpIpLimiter,
  otpPhoneLimiter,
);
app.use("/api/auth/login", loginLimiter);

// ---------- سرو کردن فایل‌های استاتیک (عکس‌های آپلودشده) ----------
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---------- Health Check ----------
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Server is up and running 🐾" });
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/loyalty-tiers", loyaltyTierRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ---------- Error Handlers (باید آخر از همه باشن) ----------
app.use(notFound);
app.use(errorHandler);

export default app;
