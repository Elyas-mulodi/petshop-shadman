import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import { getDashboardSummary } from "./DashboardCn.js";

const router = express.Router();

router.get("/summary", protect, authorize("admin"), getDashboardSummary);

export default router;