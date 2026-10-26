import { z } from "zod";

const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به شکل YYYY-MM-DD باشد");

export const dashboardQuerySchema = z.object({
  from: dayString.optional(),
  to: dayString.optional(),
  granularity: z.enum(["day", "week", "month"], { error: "بازه‌ی تجمیع نامعتبر است" }).optional(),
  metric: z.enum(["revenue", "quantity"], { error: "معیار نامعتبر است" }).optional(),
  limit: z.string().regex(/^\d+$/, "limit باید عدد باشد").optional(),
});