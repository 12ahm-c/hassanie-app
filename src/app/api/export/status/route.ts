import { prisma } from "@/lib/db/prisma";
import { ExportService } from "@/lib/services/export.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NextRequest } from "next/server";

const exportService = new ExportService(prisma);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId") || undefined;

    const status = await exportService.getExportStatus(jobId);
    return successResponse(status);
  } catch (error) {
    return handleApiError(error);
  }
}
