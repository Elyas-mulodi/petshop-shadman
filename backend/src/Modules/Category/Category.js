import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import createUploader from "../../Utils/uploadService.js";
import {
  createCategory,
  getCategoryTree,
  getAllCategoriesAdmin,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "./CategoryCn.js";
import { createCategorySchema, updateCategorySchema } from "./CategoryValidation.js";

const router = express.Router();
const upload = createUploader("categories");

// ---------- عمومی ----------
router.get("/", getCategoryTree);
router.get("/admin/all", protect, authorize("admin"), getAllCategoriesAdmin);
router.get("/:slug", getCategoryBySlug);

// ---------- ادمین ----------
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  validate(createCategorySchema),
  createCategory
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  validate(updateCategorySchema),
  updateCategory
);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;