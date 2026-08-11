import { apiClient } from "@/lib/api/client";
import {
  QaPairDTO,
  QaBatchResult,
  QaFilters,
  PaginatedResult,
} from "@/types";

export const qaService = {
  findAll: async (
    filters: QaFilters = {}
  ): Promise<PaginatedResult<QaPairDTO>> => {
    const result = await apiClient.getPaginated<QaPairDTO>("/qa", filters);
    return {
      data: result.data,
      meta: result.meta,
    };
  },

  findOne: (id: number) => apiClient.get<QaPairDTO>(`/qa/${id}`),

  createBatch: (pairs: { question: string; answer: string }[]) =>
    apiClient.post<QaBatchResult>("/qa/batch", { pairs }),

  createSingle: (question: string, answer: string) =>
    apiClient.post<QaPairDTO>("/qa", { question, answer }),

  update: (id: number, question: string, answer: string) =>
    apiClient.put<QaPairDTO>(`/qa/${id}`, { question, answer }),

  delete: (id: number) => apiClient.delete<void>(`/qa/${id}`),

  deleteMany: (filter?: { status?: string; exported?: boolean; ids?: number[] }) =>
    apiClient.delete<{ deletedCount: number }>("/qa", { filter }),
};
