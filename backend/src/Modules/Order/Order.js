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
  getOrderCounts,
  exportOrders,
  bulkUpdateStatus,
  getAdminOrder,
  updateOrderStatus,
  updateShipping,
  addOrderNote,
  markRefundDone,
} from "./OrderCn.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateShippingSchema,
  addOrderNoteSchema,
  markRefundSchema,
  bulkStatusSchema,
  getAdminOrdersQuerySchema,
} from "./OrderValidation.js";

const admin = [protect, authorize("admin")];
const listQuery = validate(getAdminOrdersQuerySchema, "query");

const router = express.Router();

// ---------- عمومی (زرین‌پال بدون لاگین کاربر رو اینجا ریدایرکت می‌کنه) ----------
router.get("/verify", verifyOrderPayment);
router.get("/shipping-config", getShippingConfig);

// ---------- ادمین (قبل از مسیرهای /:id تا با آن‌ها قاطی نشن) ----------
router.get("/admin/all", ...admin, listQuery, getAllOrders);
router.get("/admin/counts", ...admin, listQuery, getOrderCounts);
router.get("/admin/export", ...admin, listQuery, exportOrders);
router.patch(
  "/admin/bulk-status",
  ...admin,
  validate(bulkStatusSchema),
  bulkUpdateStatus,
);
router.get("/admin/:id", ...admin, getAdminOrder);
router.patch(
  "/admin/:id/status",
  ...admin,
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);
router.patch(
  "/admin/:id/shipping",
  ...admin,
  validate(updateShippingSchema),
  updateShipping,
);
router.post(
  "/admin/:id/notes",
  ...admin,
  validate(addOrderNoteSchema),
  addOrderNote,
);
router.patch(
  "/admin/:id/refund",
  ...admin,
  validate(markRefundSchema),
  markRefundDone,
);

// ---------- کاربر ----------
router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getMyOrders);
router.post("/:id/pay", protect, retryOrderPayment);
router.patch("/:id/cancel", protect, cancelMyOrder);
router.get("/:id", protect, getOrderById);

export default router;
