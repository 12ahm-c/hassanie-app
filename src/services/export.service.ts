import { apiClient } from "@/lib/api/client";
import { PreviewResult, ExportStatus, ExportResult } from "@/types/export";

export const exportService = {
  preview: () => apiClient.post<PreviewResult>("/export/preview"),

  getStatus: (jobId?: string) =>
    apiClient.get<ExportStatus>("/export/status", jobId ? { jobId } : undefined),

  exportToHF: () => apiClient.post<ExportResult>("/export/hf"),

  downloadDataset: async () => {
    const res = await fetch("/api/export/dataset");
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dataset.jsonl";
    a.click();
    URL.revokeObjectURL(url);
  },
};
