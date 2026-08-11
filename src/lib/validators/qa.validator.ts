import { z } from "zod";

export const qaBatchSchema = z.object({
  pairs: z
    .array(
      z.object({
        question: z.string().trim().min(1, "Question is required").max(5000),
        answer: z.string().trim().min(1, "Answer is required").max(5000),
      })
    )
    .min(1, "At least one Q&A pair is required")
    .max(200, "Maximum 200 pairs per batch"),
});

export const qaCreateSingleSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(5000),
  answer: z.string().trim().min(1, "Answer is required").max(5000),
});

export const qaFindAllSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "ANSWERED"]).optional(),
  search: z.string().optional(),
  exported: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const qaUpdateSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(5000),
  answer: z.string().trim().min(1, "Answer is required").max(5000),
});

export const qaDeleteManySchema = z.object({
  filter: z
    .object({
      status: z.enum(["PENDING", "ANSWERED", "ALL"]).optional(),
      exported: z.boolean().optional(),
      ids: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});

export type QaBatchInput = z.infer<typeof qaBatchSchema>;
export type QaCreateSingleInput = z.infer<typeof qaCreateSingleSchema>;
export type QaFindAllInput = z.infer<typeof qaFindAllSchema>;
export type QaUpdateInput = z.infer<typeof qaUpdateSchema>;
export type QaDeleteManyInput = z.infer<typeof qaDeleteManySchema>;
