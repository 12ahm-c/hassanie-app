import { PrismaClient } from "@prisma/client";
import { DashboardStats } from "@/types";
import { HuggingFaceService } from "./huggingface.service";

export class StatisticsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalSentences, translated, pending, exported, lastExport] =
      await Promise.all([
        this.prisma.sentence.count(),
        this.prisma.sentence.count({ where: { status: "TRANSLATED" } }),
        this.prisma.sentence.count({ where: { status: "PENDING" } }),
        this.prisma.sentence.count({
          where: { exportedAt: { not: null } },
        }),
        this.prisma.sentence.findFirst({
          where: { exportedAt: { not: null } },
          orderBy: { exportedAt: "desc" },
          select: { exportedAt: true },
        }),
      ]);

    let hfTotal = 0;
    let totalInDataset = totalSentences;
    try {
      const hfService = new HuggingFaceService();
      const existingData = await hfService.downloadDataset();
      if (existingData) {
        hfTotal = hfService.countDatasetRows(existingData);
        totalInDataset = hfTotal;
      }
    } catch {
      hfTotal = 0;
    }

    return {
      totalSentences: totalInDataset,
      translated,
      pending,
      exported,
      lastExportAt: lastExport?.exportedAt?.toISOString() ?? null,
      hfTotal,
    };
  }
}
