import { z } from "zod";

export const createBrandSchema = z.object({
  name: z
    .string({ required_error: "نام برند الزامی است" })
    .trim()
    .min(2, "نام برند باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام برند نباید بیشتر از ۵۰ کاراکتر باشد"),
  isActive: z.enum(["true", "false"]).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();