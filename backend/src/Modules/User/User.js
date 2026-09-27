import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleBlockUser,
} from "./UserCn.js";
import { updateProfileSchema, changePasswordSchema } from "./UserValidation.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.get("/admin/all", protect, authorize("admin"), getAllUsers);

router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);
router.patch(
  "/admin/:id/toggle-block",
  protect,
  authorize("admin"),
  toggleBlockUser,
);

export default router;
