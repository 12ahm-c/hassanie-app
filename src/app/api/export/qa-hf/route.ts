import { prisma } from "@/lib/db/prisma";
import { QaService } from "@/lib/services/qa.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { InvalidStateError } from "@/lib/errors/AppError";
import { HuggingFaceService } from "@/lib/services/huggingface.service";
import { NextRequest } from "next/server";

const QA_HF_REPO = "ahmed200512/hassanie_claude-qa";

export async function POST(_request: NextRequest) {
  try {
    const qaService = new QaService(prisma);
    const hfService = new HuggingFaceService({
      token: process.env.HUGGINGFACE_TOKEN || "",
      repo: QA_HF_REPO,
    });

    const pendingCount = await prisma.qaPair.count({
      where: { answer: { not: "" }, exportedAt: null },
    });

    if (pendingCount === 0) {
      throw new InvalidStateError(
        "No Q&A pairs to export. Make sure pairs have answers and haven't been exported yet."
      );
    }

    const pairs = await prisma.qaPair.findMany({
      where: { answer: { not: "" }, exportedAt: null },
      orderBy: { createdAt: "asc" },
    });

    const rowsWithIds = pairs.map((p) => ({
      id: p.id,
      row: { question: p.question, answer: p.answer },
    }));

    let existing = "";
    try {
      existing = await hfService.downloadQaDataset();
    } catch {
      // No existing dataset, upload fresh
    }

    const existingKeys = hfService.getExistingQaKeys(existing);
    const uniqueRows = rowsWithIds.filter(
      ({ row }) => !existingKeys.has(`${row.question}|||${row.answer}`)
    );

    if (uniqueRows.length === 0) {
      throw new InvalidStateError(
        "This batch has already been exported to Hugging Face."
      );
    }

    const newData = uniqueRows
      .map(({ row }) => JSON.stringify(row))
      .join("\n");
    const mergedData = hfService.mergeQaDatasets(existing, newData);

    await hfService.uploadQaDataset(mergedData);

    const sentenceIds = uniqueRows.map(({ id }) => id);
    await prisma.$transaction(
      sentenceIds.map((id) =>
        prisma.qaPair.update({
          where: { id },
          data: { exportedAt: new Date() },
        })
      )
    );

    return successResponse({
      status: "COMPLETED",
      message: "Q&A pairs exported to Hugging Face successfully",
      pairsExported: uniqueRows.length,
      repo: QA_HF_REPO,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
