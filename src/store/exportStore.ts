import { create } from "zustand";
import { exportService } from "@/services/export.service";
import { useUiStore } from "./uiStore";
import { ExportStatus, PreviewResult } from "@/types/export";

interface ExportState {
  status: ExportStatus | null;
  preview: PreviewResult | null;
  isLoading: boolean;
  isExporting: boolean;
  exportProgress: number;
  error: string | null;

  fetchStatus: () => Promise<void>;
  fetchPreview: () => Promise<void>;
  exportToHF: () => Promise<void>;
  downloadDataset: () => Promise<void>;
}

export const useExportStore = create<ExportState>((set, get) => ({
  status: null,
  preview: null,
  isLoading: false,
  isExporting: false,
  exportProgress: -1,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await exportService.getStatus();
      set({ status, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchPreview: async () => {
    set({ isLoading: true, error: null });
    try {
      const preview = await exportService.preview();
      set({ preview, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  exportToHF: async () => {
    set({ isExporting: true, exportProgress: 0, error: null });
    try {
      set({ exportProgress: 1 });
      await new Promise((r) => setTimeout(r, 500));
      set({ exportProgress: 2 });
      await new Promise((r) => setTimeout(r, 500));
      set({ exportProgress: 3 });

      await exportService.exportToHF();

      set({ exportProgress: 4 });
      await get().fetchStatus();
      set({ isExporting: false, exportProgress: -1 });

      useUiStore.getState().addToast({
        type: "success",
        message: "Export completed successfully!",
      });
    } catch (err: any) {
      set({ error: err.message, isExporting: false, exportProgress: -1 });
      useUiStore.getState().addToast({
        type: "error",
        message: `Export failed: ${err.message}`,
      });
      throw err;
    }
  },

  downloadDataset: async () => {
    set({ isLoading: true, error: null });
    try {
      await exportService.downloadDataset();
      set({ isLoading: false });
      useUiStore.getState().addToast({
        type: "success",
        message: "Dataset downloaded!",
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      useUiStore.getState().addToast({
        type: "error",
        message: `Download failed: ${err.message}`,
      });
      throw err;
    }
  },
}));
