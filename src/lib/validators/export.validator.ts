import { z } from "zod";

export const previewSchema = z.object({});

export const exportStatusSchema = z.object({
  jobId: z.string().optional(),
});

export const exportHfSchema = z.object({});

export type PreviewInput = z.infer<typeof previewSchema>;
export type ExportStatusInput = z.infer<typeof exportStatusSchema>;
export type ExportHfInput = z.infer<typeof exportHfSchema>;
