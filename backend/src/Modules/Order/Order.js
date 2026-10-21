import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  createOrder,
  verifyOrderPayment,
  getShippingConfig,
  getMyOrders,
  retryOrderPayment,
  cancelMyOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "./OrderCn.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "./OrderValidation.js";

const router = express.Router();

// ---------- عمومی (زرین‌پال بدون لاگین کاربر رو اینجا ریدایرکت می‌کنه) ----------
router.get("/verify", verifyOrderPayment);
router.get("/shipping-config", getShippingConfig);

// ---------- ادمین (قبل از مسیرهای /:id تا با آن‌ها قاطی نشن) ----------
router.get("/admin/all", protect, authorize("admin"), getAllOrders);
router.patch(
  "/admin/:id/status",
  protect,
  authorize("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

// ---------- کاربر ----------
router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getMyOrders);
router.post("/:id/pay", protect, retryOrderPayment);
router.patch("/:id/cancel", protect, cancelMyOrder);
router.get("/:id", protect, getOrderById);

export default router;
