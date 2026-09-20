import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import {
  createLoyaltyTier,
  getAllLoyaltyTiers,
  updateLoyaltyTier,
  deleteLoyaltyTier,
} from "./LoyaltyTierCn.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), getAllLoyaltyTiers);
router.post("/", protect, authorize("admin"), createLoyaltyTier);
router.put("/:id", protect, authorize("admin"), updateLoyaltyTier);
router.delete("/:id", protect, authorize("admin"), deleteLoyaltyTier);

export default router;