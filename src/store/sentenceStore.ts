import { create } from "zustand";
import { sentenceService } from "@/services/sentence.service";
import {
  SentenceDTO,
  BatchResult,
  SentenceFilters,
  Status,
} from "@/types";

interface SentenceState {
  sentences: SentenceDTO[];
  filters: SentenceFilters;
  pagination: { page: number; limit: number; total: number };
  pendingCount: number;
  translatedCount: number;
  isLoading: boolean;
  error: string | null;

  fetchSentences: (filters?: SentenceFilters) => Promise<void>;
  addSentences: (phrases: string[]) => Promise<BatchResult>;
  addSingle: (arabic: string) => Promise<SentenceDTO>;
  updateTranslation: (id: number, hassaniya: string) => Promise<void>;
  deleteSentence: (id: number) => Promise<void>;
  deleteMany: (filter?: { status?: Status | "ALL"; exported?: boolean; ids?: number[] }) => Promise<void>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
}

const defaultFilters: SentenceFilters = {
  page: 1,
  limit: 20,
};

export const useSentenceStore = create<SentenceState>((set, get) => ({
  sentences: [],
  filters: { ...defaultFilters },
  pagination: { page: 1, limit: 20, total: 0 },
  pendingCount: 0,
  translatedCount: 0,
  isLoading: false,
  error: null,

  fetchSentences: async (filters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null });
    try {
      const result = await sentenceService.findAll(currentFilters);
      const meta = result.meta || { page: 1, limit: 20, total: 0, pendingCount: 0, translatedCount: 0 };
      set({
        sentences: result.data || [],
        pagination: {
          page: meta.page || 1,
          limit: meta.limit || 20,
          total: meta.total || 0,
        },
        pendingCount: meta.pendingCount || 0,
        translatedCount: meta.translatedCount || 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addSentences: async (phrases) => {
    set({ isLoading: true, error: null });
    try {
      const result = await sentenceService.createBatch(phrases);
      await get().fetchSentences();
      set({ isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addSingle: async (arabic) => {
    set({ isLoading: true, error: null });
    try {
      const result = await sentenceService.createSingle(arabic);
      await get().fetchSentences();
      set({ isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateTranslation: async (id, hassaniya) => {
    set({ isLoading: true, error: null });
    try {
      await sentenceService.updateTranslation(id, hassaniya);
      await get().fetchSentences();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteSentence: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await sentenceService.delete(id);
      await get().fetchSentences();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteMany: async (filter) => {
    set({ isLoading: true, error: null });
    try {
      await sentenceService.deleteMany(filter);
      await get().fetchSentences();
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
    get().fetchSentences();
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchSentences();
  },

  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters, page },
      pagination: { ...state.pagination, page },
    }));
    get().fetchSentences();
  },
}));
