import { prisma } from "@/lib/db/prisma";
import { PhraseService } from "@/lib/services/phrase.service";
import {
  createSingleSchema,
  findAllSchema,
  deleteManySchema,
} from "@/lib/validators/phrase.validator";
import {
  createdResponse,
  paginatedResponse,
  noContentResponse,
  handleApiError,
} from "@/lib/api-response";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const phraseService = new PhraseService(prisma);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = findAllSchema.safeParse(params);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid query parameters", fields);
    }

    const result = await phraseService.findAll(parsed.data);
    return paginatedResponse(result.data, {
      ...result.meta,
      pendingCount: result.meta.pendingCount,
      translatedCount: result.meta.translatedCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSingleSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid input", fields);
    }

    const sentence = await phraseService.createSingle(parsed.data.arabic);
    return createdResponse(sentence);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = deleteManySchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid filter", fields);
    }

    const result = await phraseService.deleteMany(parsed.data.filter);
    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
