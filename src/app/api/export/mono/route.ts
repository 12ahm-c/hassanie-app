import { HuggingFaceService } from "@/lib/services/huggingface.service";
import { cleanMonoSentences } from "@/lib/mono-cleaner";
import { successResponse, handleApiError } from "@/lib/api-response";
import { InvalidStateError, ValidationError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const MONO_REPO = "ahmed200512/hassanie_claude-mono";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content : "";
    const cleaned = cleanMonoSentences(content);

    if (cleaned.lines.length === 0) {
      throw new ValidationError("Please provide at least one sentence.");
    }

    const hfService = new HuggingFaceService({
      token: process.env.HUGGINGFACE_TOKEN || "",
      repo: process.env.HUGGINGFACE_MONO_REPO || MONO_REPO,
    });

    const uniqueRows = cleaned.lines;

    if (uniqueRows.length === 0) {
      throw new InvalidStateError("All cleaned sentences already exist in Hugging Face.");
    }

    const newData = uniqueRows.map((text) => JSON.stringify({ text })).join("\n");
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const filename = `data/uploads/mono-${stamp}.parquet`;

    await hfService.uploadMonoDataset(
      newData,
      filename,
      `Add mono sentences ${stamp}`
    );

    return successResponse({
      repo: process.env.HUGGINGFACE_MONO_REPO || MONO_REPO,
      uploaded: uniqueRows.length,
      cleaned: cleaned.lines.length,
      duplicatesRemoved: cleaned.removedDuplicates,
      datasetSizeBefore: null,
      datasetSizeAfter: null,
      file: filename,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
