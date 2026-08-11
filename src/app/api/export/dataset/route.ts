import { prisma } from "@/lib/db/prisma";
import { ExportService } from "@/lib/services/export.service";
import { handleApiError } from "@/lib/api-response";
import { InvalidStateError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const exportService = new ExportService(prisma);

export async function GET(_request: NextRequest) {
  try {
    const translatedCount = await prisma.sentence.count({
      where: { status: "TRANSLATED", hassaniya: { not: null } },
    });

    if (translatedCount === 0) {
      throw new InvalidStateError("No translated sentences to export");
    }

    const jsonl = await exportService.generateJSONL();

    return new Response(jsonl, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": 'attachment; filename="dataset.jsonl"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
