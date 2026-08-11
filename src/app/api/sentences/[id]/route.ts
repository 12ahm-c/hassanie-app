import { prisma } from "@/lib/db/prisma";
import { PhraseService } from "@/lib/services/phrase.service";
import { updateTranslationSchema } from "@/lib/validators/phrase.validator";
import {
  successResponse,
  noContentResponse,
  handleApiError,
} from "@/lib/api-response";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const phraseService = new PhraseService(prisma);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID parameter");
    }

    const sentence = await phraseService.findOne(id);
    if (!sentence) {
      throw new NotFoundError("Sentence");
    }

    return successResponse(sentence);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID parameter");
    }

    const body = await request.json();
    const parsed = updateTranslationSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid input", fields);
    }

    const existing = await phraseService.findOne(id);
    if (!existing) {
      throw new NotFoundError("Sentence");
    }

    const updated = await phraseService.updateTranslation(
      id,
      parsed.data.hassaniya
    );
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID parameter");
    }

    const existing = await phraseService.findOne(id);
    if (!existing) {
      throw new NotFoundError("Sentence");
    }

    await phraseService.deleteOne(id);
    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
