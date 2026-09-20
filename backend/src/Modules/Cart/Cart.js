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
} from "./CartCn.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  syncCartSchema,
} from "./CartValidation.js";

const router = express.Router();

// همه‌ی مسیرهای سبد خرید نیاز به لاگین دارن (طبق تصمیم قبلی: سبد مهمان فقط سمت کلاینته)
router.use(protect);

router.get("/", getCart);
router.post("/add", validate(addToCartSchema), addToCart);
router.put("/update", validate(updateCartItemSchema), updateCartItem);
router.delete("/remove", validate(removeCartItemSchema), removeCartItem);
router.delete("/clear", clearCart);
router.post("/sync", validate(syncCartSchema), syncCart);

export default router;