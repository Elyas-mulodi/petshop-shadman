import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import { list, adminList, adminGetById, create, update, remove } from "./BannerCn.js";
import {
  createBannerSchema,
  updateBannerSchema,
  publicBannersQuerySchema,
  bannerIdParamSchema,
} from "./BannerValidation.js";

const admin = [protect, authorize("admin")];
const idParam = validate(bannerIdParamSchema, "params");

const router = express.Router();

// عمومی
router.get("/", validate(publicBannersQuerySchema, "query"), list);

// ادمین (مسیرهای /admin قبل از /:id)
router.get("/admin/list", ...admin, adminList);
router.get("/admin/:id", ...admin, idParam, adminGetById);
router.post("/", ...admin, validate(createBannerSchema), create);
router.patch("/:id", ...admin, idParam, validate(updateBannerSchema), update);
router.delete("/:id", ...admin, idParam, remove);

export default router;

