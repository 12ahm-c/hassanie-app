import { prisma } from "@/lib/db/prisma";
import { ExportService } from "@/lib/services/export.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { InvalidStateError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const exportService = new ExportService(prisma);

export async function POST(_request: NextRequest) {
  try {
    const result = await exportService.previewExport();

    if (result.count === 0) {
      throw new InvalidStateError("No translated sentences to preview");
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
