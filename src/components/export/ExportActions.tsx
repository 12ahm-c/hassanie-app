"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExportActionsProps {
  hasTranslated: boolean;
  isExporting: boolean;
  isLoading: boolean;
  onExport: () => void;
  onDownload: () => void;
}

export function ExportActions({
  hasTranslated,
  isExporting,
  isLoading,
  onExport,
  onDownload,
}: ExportActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={onExport}
            isLoading={isExporting}
            disabled={!hasTranslated}
          >
            Export to Hugging Face
          </Button>
          <Button
            variant="outline"
            onClick={onDownload}
            isLoading={isLoading}
            disabled={!hasTranslated}
          >
            Download Dataset (JSONL)
          </Button>
        </div>
        {!hasTranslated && (
          <p className="text-sm text-gray-500">
            No translated sentences available for export.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
