import { prisma } from "@/lib/db/prisma";
import { ExportService } from "@/lib/services/export.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { InvalidStateError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const exportService = new ExportService(prisma);

export async function POST(_request: NextRequest) {
  try {
    const activeJob = exportService.getActiveJob();
    if (activeJob) {
      throw new InvalidStateError("Export job already in progress");
    }

    const untranslatedCount = await prisma.sentence.count({
      where: { status: "TRANSLATED", hassaniya: { not: null }, exportedAt: null },
    });

    if (untranslatedCount === 0) {
      throw new InvalidStateError("No untranslated sentences to export. All translated sentences have already been exported.");
    }

    const result = await exportService.exportToHuggingFace();
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
