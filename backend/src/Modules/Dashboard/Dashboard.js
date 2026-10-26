import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import { dashboardQuerySchema } from "./DashboardValidation.js";
import {
  getOverview,
  getSales,
  getStatusBreakdown,
  getTopProducts,
  getCategoryBreakdown,
  getBrandBreakdown,
  getCustomers,
  getDiscounts,
  getFunnel,
  getPatterns,
  getGeo,
  getInventory,
  getRecentOrders,
} from "./DashboardCn.js";

const router = express.Router();

router.use(protect, authorize("admin"));

const q = validate(dashboardQuerySchema, "query");

router.get("/overview", q, getOverview);
router.get("/sales", q, getSales);
router.get("/status", q, getStatusBreakdown);
router.get("/top-products", q, getTopProducts);
router.get("/categories", q, getCategoryBreakdown);
router.get("/brands", q, getBrandBreakdown);
router.get("/customers", q, getCustomers);
router.get("/discounts", q, getDiscounts);
router.get("/funnel", q, getFunnel);
router.get("/patterns", q, getPatterns);
router.get("/geo", q, getGeo);
router.get("/inventory", getInventory);
router.get("/recent-orders", getRecentOrders);

export default router;
