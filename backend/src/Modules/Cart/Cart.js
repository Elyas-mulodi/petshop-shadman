import express from "express";
import { protect } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
  previewCart,
} from "./CartCn.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  syncCartSchema,
} from "./CartValidation.js";

const router = express.Router();

// عمومی: پیش‌نمایش سبد مهمان (باید قبل از protect باشه)
router.post("/preview", validate(syncCartSchema), previewCart);

// بقیه مسیرها نیاز به لاگین دارن
router.use(protect);

router.get("/", getCart);
router.post("/add", validate(addToCartSchema), addToCart);
router.put("/update", validate(updateCartItemSchema), updateCartItem);
router.delete("/remove", validate(removeCartItemSchema), removeCartItem);
router.delete("/clear", clearCart);
router.post("/sync", validate(syncCartSchema), syncCart);

export default router;