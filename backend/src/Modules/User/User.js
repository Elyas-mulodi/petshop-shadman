import express from "express";
import { protect } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import { getProfile, updateProfile, changePassword } from "./UserCn.js";
import { updateProfileSchema, changePasswordSchema } from "./UserValidation.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put("/change-password", protect, validate(changePasswordSchema), changePassword);

export default router;