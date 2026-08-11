import { prisma } from "@/lib/db/prisma";
import { StatisticsService } from "@/lib/services/statistics.service";
import { successResponse, handleApiError } from "@/lib/api-response";
import { NextRequest } from "next/server";

const statisticsService = new StatisticsService(prisma);

export async function GET(_request: NextRequest) {
  try {
    const stats = await statisticsService.getDashboardStats();
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
