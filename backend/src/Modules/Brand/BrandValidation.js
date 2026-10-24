import { z } from "zod";
import { requiredMsg } from "../../Utils/zodMessages.js";

export const createBrandSchema = z.object({
  name: z
    .string(requiredMsg("نام برند"))
    .trim()
    .min(2, "نام برند باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام برند نباید بیشتر از ۵۰ کاراکتر باشد"),
  isActive: z.enum(["true", "false"], { error: "مقدار isActive باید true یا false باشد" }).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();