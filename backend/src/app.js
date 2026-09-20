import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ---------- Global Middlewares ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests, please try again later.",
});
app.use(globalLimiter);

// ---------- سرو کردن فایل‌های استاتیک (عکس‌های آپلودشده) ----------
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---------- Health Check ----------
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is up and running 🐾" });
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/loyalty-tiers", loyaltyTierRoutes);
app.use("/api/cart", cartRoutes);

// ---------- Error Handlers (باید آخر از همه باشن) ----------
app.use(notFound);
app.use(errorHandler);

export default app;