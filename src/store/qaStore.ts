import { create } from "zustand";
import { qaService } from "@/services/qa.service";
import {
  QaPairDTO,
  QaBatchResult,
  QaFilters,
  QaStatus,
  PaginatedResult,
} from "@/types";

interface QaState {
  pairs: QaPairDTO[];
  filters: QaFilters;
  pagination: { page: number; limit: number; total: number };
  pendingCount: number;
  answeredCount: number;
  isLoading: boolean;
  error: string | null;

  fetchPairs: (filters?: QaFilters) => Promise<void>;
  addPairs: (pairs: { question: string; answer: string }[]) => Promise<QaBatchResult>;
  addSingle: (question: string, answer: string) => Promise<QaPairDTO>;
  updatePair: (id: number, question: string, answer: string) => Promise<void>;
  deletePair: (id: number) => Promise<void>;
  deleteMany: (filter?: { status?: string; exported?: boolean; ids?: number[] }) => Promise<void>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
}

const defaultFilters: QaFilters = {
  page: 1,
  limit: 20,
};

export const useQaStore = create<QaState>((set, get) => ({
  pairs: [],
  filters: { ...defaultFilters },
  pagination: { page: 1, limit: 20, total: 0 },
  pendingCount: 0,
  answeredCount: 0,
  isLoading: false,
  error: null,

  fetchPairs: async (filters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null });
    try {
      const result = await qaService.findAll(currentFilters);
      const meta = result.meta || { page: 1, limit: 20, total: 0, pendingCount: 0, translatedCount: 0 };
      set({
        pairs: result.data || [],
        pagination: {
          page: meta.page || 1,
          limit: meta.limit || 20,
          total: meta.total || 0,
        },
        pendingCount: meta.pendingCount || 0,
        answeredCount: meta.translatedCount || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addPairs: async (pairs) => {
    set({ isLoading: true, error: null });
    try {
      const result = await qaService.createBatch(pairs);
      await get().fetchPairs();
      set({ isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addSingle: async (question, answer) => {
    set({ isLoading: true, error: null });
    try {
      const result = await qaService.createSingle(question, answer);
      await get().fetchPairs();
      set({ isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updatePair: async (id, question, answer) => {
    set({ isLoading: true, error: null });
    try {
      await qaService.update(id, question, answer);
      await get().fetchPairs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deletePair: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await qaService.delete(id);
      await get().fetchPairs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteMany: async (filter) => {
    set({ isLoading: true, error: null });
    try {
      await qaService.deleteMany(filter);
      await get().fetchPairs();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    }));
    get().fetchPairs();
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchPairs();
  },

  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters, page },
      pagination: { ...state.pagination, page },
    }));
    get().fetchPairs();
  },
}));
