import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import createUploader from "../../Utils/uploadService.js";
import {
  createProduct,
  getProducts,
  getNewProducts,
  getDiscountedProducts,
  getProductBySlug,
  updateProduct,
  removeProductImage,
  deleteProduct,
} from "./ProductCn.js";
import { createProductSchema, getProductsQuerySchema, updateProductSchema } from "./ProductValidation.js";

const router = express.Router();
const upload = createUploader("products");

// ---------- عمومی ----------
router.get("/", validate(getProductsQuerySchema, "query"), getProducts);
router.get("/new", getNewProducts);
router.get("/discounted", getDiscountedProducts);
router.get("/:slug", getProductBySlug);

// ---------- ادمین ----------
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  validate(createProductSchema),
  createProduct
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  validate(updateProductSchema),
  updateProduct
);
router.patch("/:id/remove-image", protect, authorize("admin"), removeProductImage);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;