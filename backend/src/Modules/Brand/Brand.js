import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import createUploader from "../../Utils/uploadService.js";
import {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
} from "./BrandCn.js";
import { createBrandSchema, updateBrandSchema } from "./BrandValidation.js";

const router = express.Router();
const upload = createUploader("brands");

router.get("/", getAllBrands);
router.post("/", protect, authorize("admin"), upload.single("logo"), validate(createBrandSchema), createBrand);
router.put("/:id", protect, authorize("admin"), upload.single("logo"), validate(updateBrandSchema), updateBrand);
router.delete("/:id", protect, authorize("admin"), deleteBrand);

export default router;