import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { notFound, errorHandler } from "./Middlewares/errorHandler.js";
import authRoutes from "./Modules/Auth/Auth.js";

const app = express();

// ---------- Global Middlewares ----------
app.use(helmet());
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

// ---------- Health Check ----------
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is up and running 🐾" });
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);

// ---------- Error Handlers  ----------
app.use(notFound);
app.use(errorHandler);

export default app;