import express from "express";
import { protect, authorize } from "../../Middlewares/auth.js";
import validate from "../../Middlewares/validate.js";
import { getAuditLogs } from "./AuditLogCn.js";
import { getAuditLogsQuerySchema } from "./AuditLogValidation.js";

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  validate(getAuditLogsQuerySchema, "query"),
  getAuditLogs,
);

export default router;
