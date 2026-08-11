import { prisma } from "@/lib/db/prisma";
import { QaService } from "@/lib/services/qa.service";
import { qaBatchSchema } from "@/lib/validators/qa.validator";
import { createdResponse, handleApiError } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors/AppError";
import { NextRequest } from "next/server";

const qaService = new QaService(prisma);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = qaBatchSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fields[issue.path.join(".")] = issue.message;
      });
      throw new ValidationError("Invalid input", fields);
    }

    const result = await qaService.createBatch(parsed.data.pairs);
    return createdResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
