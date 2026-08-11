import { prisma } from "@/lib/db/prisma";
import { PhraseService } from "@/lib/services/phrase.service";
import { createBatchSchema } from "@/lib/validators/phrase.validator";
import {
  createdResponse,
  handleApiError,
} from "@/lib/api-response";
import { ValidationError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const phraseService = new PhraseService(prisma);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid input", fields);
    }

    const result = await phraseService.createBatch(parsed.data.phrases);
    return createdResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
