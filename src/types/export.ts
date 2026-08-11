export interface PreviewResult {
  preview: { arabic: string; hassani: string }[];
  count: number;
}

export interface ExportStatus {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  totalProcessed: number;
  failedItems: string[];
  error: string | null;
}

export interface ExportResult {
  jobId: string;
  status: string;
  message: string;
  sentencesExported: number;
  datasetSizeBefore: number;
  datasetSizeAfter: number;
  duplicatesRemoved: number;
}

export interface DatasetRow {
  arabic: string;
  hassani: string;
}
