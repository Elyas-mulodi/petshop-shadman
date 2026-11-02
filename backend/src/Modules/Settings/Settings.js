import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import { getAdminSettings, updateSettings } from "./SettingsCn.js";
import { updateSettingsSchema } from "./SettingsValidation.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", getAdminSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);

export default router;
