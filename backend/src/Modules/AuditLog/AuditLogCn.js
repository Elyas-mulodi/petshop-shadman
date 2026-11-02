import asyncHandler from "express-async-handler";
import AuditLog from "./AuditLogMd.js";
import escapeRegex from "../../Utils/escapeRegex.js";
import { parsePagination } from "../../Utils/pagination.js";
import { buildDateFilter } from "../../Utils/dateRange.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    defaultLimit: 30,
    maxLimit: 100,
  });
  const { entityType, entityId, search, from, to } = req.query;

  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  const range = buildDateFilter(from, to);
  if (range) filter.createdAt = range;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ summary: rx }, { entityLabel: rx }, { actorLabel: rx }];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});
