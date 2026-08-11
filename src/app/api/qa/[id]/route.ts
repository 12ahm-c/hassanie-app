import { prisma } from "@/lib/db/prisma";
import { QaService } from "@/lib/services/qa.service";
import { qaUpdateSchema } from "@/lib/validators/qa.validator";
import {
  successResponse,
  noContentResponse,
  handleApiError,
} from "@/lib/api-response";
import { ValidationError, NotFoundError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const qaService = new QaService(prisma);

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

    const pair = await qaService.findOne(id);
    if (!pair) {
      throw new NotFoundError("Q&A pair");
    }

    return successResponse(pair);
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
    const parsed = qaUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid input", fields);
    }

    const existing = await qaService.findOne(id);
    if (!existing) {
      throw new NotFoundError("Q&A pair");
    }

    const updated = await qaService.update(
      id,
      parsed.data.question,
      parsed.data.answer
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

    const existing = await qaService.findOne(id);
    if (!existing) {
      throw new NotFoundError("Q&A pair");
    }

    await qaService.deleteOne(id);
    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
