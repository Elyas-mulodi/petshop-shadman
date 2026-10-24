import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "./CouponCn.js";
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from "./CouponValidation.js";

const router = express.Router();

// ---------- ادمین ----------
router.get("/", protect, authorize("admin"), getAllCoupons);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createCouponSchema),
  createCoupon,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validate(updateCouponSchema),
  updateCoupon,
);
router.delete("/:id", protect, authorize("admin"), deleteCoupon);

// ---------- کاربر ----------
router.post("/apply", protect, validate(applyCouponSchema), applyCoupon);

export default router;
