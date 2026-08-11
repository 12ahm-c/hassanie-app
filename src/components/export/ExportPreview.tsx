"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PreviewResult } from "@/types/export";

interface ExportPreviewProps {
  preview: PreviewResult | null;
  isLoading: boolean;
  onPreview: () => void;
}

export function ExportPreview({ preview, isLoading, onPreview }: ExportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview Export</CardTitle>
          <Button onClick={onPreview} isLoading={isLoading} variant="outline" size="sm">
            Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSpinner size="sm" />}

        {!isLoading && preview && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Showing {preview.preview.length} of {preview.count} translated sentences
            </p>
            <pre className="max-h-64 overflow-auto rounded-md bg-gray-50 p-4 text-xs text-gray-800">
              {preview.preview
                .map((row) => JSON.stringify({ arabic: row.arabic, hassani: row.hassani }))
                .join("\n")}
            </pre>
          </div>
        )}

        {!isLoading && !preview && (
          <p className="text-sm text-gray-500">
            Click &quot;Preview&quot; to see the first 10 translated sentences in JSONL format.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
