import { z } from "zod";

const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به شکل YYYY-MM-DD باشد");

export const getAuditLogsQuerySchema = z.object({
  entityType: z
    .string()
    .regex(/^[a-z_]{1,30}$/, "نوع نامعتبر است")
    .optional(),
  entityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "شناسه نامعتبر است")
    .optional(),
  search: z.string().trim().max(60).optional(),
  from: dayString.optional(),
  to: dayString.optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
