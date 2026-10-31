import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import {
  createLoyaltyTier,
  getAllLoyaltyTiers,
  getPublicLoyaltyTiers,
  updateLoyaltyTier,
  deleteLoyaltyTier,
} from "./LoyaltyTierCn.js";
import { createLoyaltyTierSchema, updateLoyaltyTierSchema } from "./LoyaltyTierValidation.js";

const router = express.Router();
const admin = [protect, authorize("admin")];

router.get("/public", getPublicLoyaltyTiers);

router.get("/", ...admin, getAllLoyaltyTiers);
router.post("/", ...admin, validate(createLoyaltyTierSchema), createLoyaltyTier);
router.put("/:id", ...admin, validate(updateLoyaltyTierSchema), updateLoyaltyTier);
router.delete("/:id", ...admin, deleteLoyaltyTier);

export default router;