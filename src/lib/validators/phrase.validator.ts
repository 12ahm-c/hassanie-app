import { z } from "zod";

export const createBatchSchema = z.object({
  phrases: z
    .array(z.string().trim().min(2).max(5000))
    .min(1, "At least one phrase is required")
    .max(100, "Maximum 100 phrases per batch"),
});

export const createSingleSchema = z.object({
  arabic: z.string().trim().min(2, "Arabic text is required").max(5000),
});

export const findAllSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "TRANSLATED"]).optional(),
  search: z.string().optional(),
  exported: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const updateTranslationSchema = z.object({
  hassaniya: z.string().trim().min(1, "Hassaniya translation is required").max(5000),
});

export const clearTranslationSchema = z.object({
  hassaniya: z.nullable(z.string()),
});

export const deleteManySchema = z.object({
  filter: z
    .object({
      status: z.enum(["PENDING", "TRANSLATED", "ALL"]).optional(),
      exported: z.boolean().optional(),
      ids: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type CreateSingleInput = z.infer<typeof createSingleSchema>;
export type FindAllInput = z.infer<typeof findAllSchema>;
export type UpdateTranslationInput = z.infer<typeof updateTranslationSchema>;
export type ClearTranslationInput = z.infer<typeof clearTranslationSchema>;
export type DeleteManyInput = z.infer<typeof deleteManySchema>;
