import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserCounts,
  getTopCustomers,
  getAdminUser,
  toggleBlockUser,
  addUserNote,
} from "./UserCn.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  getAdminUsersQuerySchema,
  blockUserSchema,
  addUserNoteSchema,
} from "./UserValidation.js";

const router = express.Router();
const admin = [protect, authorize("admin")];

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);

// ---------- ادمین (مسیرهای ثابت قبل از /admin/:id) ----------
router.get(
  "/admin/all",
  ...admin,
  validate(getAdminUsersQuerySchema, "query"),
  getAllUsers,
);
router.get("/admin/counts", ...admin, getUserCounts);
router.get("/admin/top", ...admin, getTopCustomers);
router.get("/admin/:id", ...admin, getAdminUser);
router.patch(
  "/admin/:id/toggle-block",
  ...admin,
  validate(blockUserSchema),
  toggleBlockUser,
);
router.post(
  "/admin/:id/notes",
  ...admin,
  validate(addUserNoteSchema),
  addUserNote,
);

export default router;
