import { apiClient } from "@/lib/api/client";
import {
  SentenceDTO,
  BatchResult,
  PaginatedResult,
  SentenceFilters,
  DeleteManyFilter,
} from "@/types";

export const sentenceService = {
  findAll: async (filters: SentenceFilters = {}): Promise<PaginatedResult<SentenceDTO>> => {
    const result = await apiClient.getPaginated<SentenceDTO>("/sentences", filters);
    return {
      data: result.data,
      meta: result.meta,
    };
  },

  findOne: (id: number) =>
    apiClient.get<SentenceDTO>(`/sentences/${id}`),

  createBatch: (phrases: string[]) =>
    apiClient.post<BatchResult>("/sentences/batch", { phrases }),

  createSingle: (arabic: string) =>
    apiClient.post<SentenceDTO>("/sentences", { arabic }),

  updateTranslation: (id: number, hassaniya: string) =>
    apiClient.put<SentenceDTO>(`/sentences/${id}`, { hassaniya }),

  delete: (id: number) =>
    apiClient.delete<void>(`/sentences/${id}`),

  deleteMany: (filter?: DeleteManyFilter) =>
    apiClient.delete<{ deletedCount: number }>("/sentences", { filter }),
};
