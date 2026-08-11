import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportStatus } from "@/types/export";

interface ExportStatusCardProps {
  status: ExportStatus | null;
}

const statusVariants: Record<string, "default" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
};

export function ExportStatusCard({ status }: ExportStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant={statusVariants[status.status] || "default"}>
                {status.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sentences Exported</span>
              <span className="font-medium">{status.totalProcessed}</span>
            </div>
            {status.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Export</span>
                <span className="text-sm">
                  {new Date(status.completedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {status.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {status.error}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No export data available</p>
        )}
      </CardContent>
    </Card>
  );
}
