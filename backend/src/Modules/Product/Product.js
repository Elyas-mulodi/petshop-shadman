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
  getAdminProducts,
  getAdminProductCounts,
  getAdminProduct,
  getAttributeSuggestions,
  bulkSetActive,
  updateVariantStock,
  addProductImages,
  reorderProductImages,
  duplicateProduct,
} from "./ProductCn.js";
import {
  createProductSchema,
  getProductsQuerySchema,
  updateProductSchema,
  removeProductImageSchema,
  getAdminProductsQuerySchema,
  bulkActiveSchema,
  updateStockSchema,
  reorderImagesSchema,
} from "./ProductValidation.js";
const router = express.Router();
const upload = createUploader("products");
const admin = [protect, authorize("admin")];

// ---------- عمومی ----------
router.get("/", validate(getProductsQuerySchema, "query"), getProducts);
router.get("/new", getNewProducts);
router.get("/discounted", getDiscountedProducts);
router.get("/:slug", getProductBySlug);

router.get("/admin/all", ...admin, validate(getAdminProductsQuerySchema, "query"), getAdminProducts);
router.get("/admin/counts", ...admin, getAdminProductCounts);
router.get("/admin/attributes", ...admin, getAttributeSuggestions);
router.patch("/admin/bulk-active", ...admin, validate(bulkActiveSchema), bulkSetActive);
router.get("/admin/:id", ...admin, getAdminProduct);
router.post("/admin/:id/duplicate", ...admin, duplicateProduct);
router.post("/admin/:id/images", ...admin, upload.array("images", 8), addProductImages);
router.patch("/admin/:id/images/order", ...admin, validate(reorderImagesSchema), reorderProductImages);
router.patch("/admin/:id/variants/:variantId/stock", ...admin, validate(updateStockSchema), updateVariantStock);

// ---------- ادمین ----------
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  validate(createProductSchema),
  createProduct,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  validate(updateProductSchema),
  updateProduct,
);
router.patch(
  "/:id/remove-image",
  protect,
  authorize("admin"),
  validate(removeProductImageSchema),
  removeProductImage,
);

router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;
