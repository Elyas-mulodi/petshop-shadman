import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  createOrder,
  verifyOrderPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "./OrderCn.js";
import { createOrderSchema, updateOrderStatusSchema } from "./OrderValidation.js";

const router = express.Router();

// ---------- عمومی (زرین‌پال بدون لاگین کاربر رو اینجا ریدایرکت می‌کنه) ----------
router.get("/verify", verifyOrderPayment);

// ---------- کاربر ----------
router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// ---------- ادمین ----------
router.get("/admin/all", protect, authorize("admin"), getAllOrders);
router.patch("/admin/:id/status", protect, authorize("admin"), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;