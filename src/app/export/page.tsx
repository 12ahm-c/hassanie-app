"use client";

import { useEffect } from "react";
import { useExportStore } from "@/store/exportStore";
import { useStatsStore } from "@/store/statsStore";
import { ExportStatusCard } from "@/components/export/ExportStatusCard";
import { ExportPreview } from "@/components/export/ExportPreview";
import { ExportActions } from "@/components/export/ExportActions";
import { ExportProgress } from "@/components/export/ExportProgress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";

export default function ExportPage() {
  const {
    status,
    preview,
    isLoading,
    isExporting,
    exportProgress,
    error,
    fetchStatus,
    fetchPreview,
    exportToHF,
    downloadDataset,
  } = useExportStore();

  const { stats, fetchStats } = useStatsStore();

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, [fetchStatus, fetchStats]);

  const handleExport = async () => {
    try {
      await exportToHF();
      await fetchStats();
    } catch {}
  };

  if (isLoading && !status) {
    return <LoadingSpinner className="py-12" />;
  }

  if (error && !status) {
    return <ErrorState message={error} onRetry={fetchStatus} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Export</h1>

      <ExportStatusCard status={status} />

      {isExporting && <ExportProgress currentStep={exportProgress} />}

      <ExportActions
        hasTranslated={(stats?.translated || 0) > 0}
        isExporting={isExporting}
        isLoading={isLoading}
        onExport={handleExport}
        onDownload={downloadDataset}
      />

      <ExportPreview
        preview={preview}
        isLoading={isLoading && !!preview}
        onPreview={fetchPreview}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
