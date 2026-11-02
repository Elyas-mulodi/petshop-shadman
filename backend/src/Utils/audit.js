import AuditLog from "../Modules/AuditLog/AuditLogMd.js";

const clip = (value) =>
  typeof value === "string" && value.length > 200
    ? `${value.slice(0, 200)}…`
    : value;
const normalize = (value) =>
  value instanceof Date
    ? value.toISOString()
    : value === undefined
      ? null
      : value;

export const diffObjects = (before, after, labels) =>
  Object.entries(labels)
    .map(([field, label]) => ({
      field,
      label,
      from: normalize(before[field]),
      to: normalize(after[field]),
    }))
    .filter((c) => String(c.from ?? "") !== String(c.to ?? ""));

export const logAudit = async (
  req,
  {
    action,
    entityType,
    entityId = null,
    entityLabel = "",
    summary,
    changes = [],
  },
) => {
  try {
    await AuditLog.create({
      actor: req.user?._id ?? null,
      actorLabel: req.user?.name || req.user?.phone || "",
      action,
      entityType,
      entityId,
      entityLabel,
      summary: summary.slice(0, 500),
      changes: changes
        .slice(0, 30)
        .map((c) => ({ ...c, from: clip(c.from), to: clip(c.to) })),
      ip: req.ip ?? "",
    });
  } catch (err) {
    console.error("خطا در ثبت لاگ فعالیت:", err.message);
  }
};
