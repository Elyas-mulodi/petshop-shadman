import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  createCoupon,
  getAllCoupons,
  getCouponCounts,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "./CouponCn.js";
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
  getCouponsQuerySchema,
} from "./CouponValidation.js";

const router = express.Router();
const admin = [protect, authorize("admin")];

// ---------- ادمین ----------
router.get(
  "/",
  ...admin,
  validate(getCouponsQuerySchema, "query"),
  getAllCoupons,
);
router.get("/counts", ...admin, getCouponCounts);
router.post("/", ...admin, validate(createCouponSchema), createCoupon);
router.put("/:id", ...admin, validate(updateCouponSchema), updateCoupon);
router.delete("/:id", ...admin, deleteCoupon);

// ---------- کاربر ----------
router.post("/apply", protect, validate(applyCouponSchema), applyCoupon);

export default router;
