export type Status = "PENDING" | "TRANSLATED";

export interface SentenceDTO {
  id: number;
  arabic: string;
  hassaniya: string | null;
  status: Status;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchResult {
  created: { id: number; arabic: string }[];
  duplicates: { arabic: string; message: string }[];
  totalCreated: number;
  totalDuplicates: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pendingCount: number;
    translatedCount: number;
  };
}

export interface DashboardStats {
  totalSentences: number;
  translated: number;
  pending: number;
  exported: number;
  lastExportAt: string | null;
  hfTotal: number;
}

export interface SentenceFilters {
  status?: Status;
  exported?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeleteManyFilter {
  status?: Status | "ALL";
  exported?: boolean;
  ids?: number[];
}

export type QaStatus = "PENDING" | "ANSWERED";

export interface QaPairDTO {
  id: number;
  question: string;
  answer: string;
  status: QaStatus;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QaBatchResult {
  created: { id: number; question: string; answer: string }[];
  duplicates: { question: string; answer: string; message: string }[];
  totalCreated: number;
  totalDuplicates: number;
}

export interface QaFilters {
  status?: QaStatus;
  exported?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  } | null;
  meta: Record<string, unknown> | null;
}
