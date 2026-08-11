import { PrismaClient } from "@prisma/client";
import { PreviewResult, ExportStatus, DatasetRow, ExportResult } from "@/types/export";
import { HuggingFaceService } from "./huggingface.service";
import { logger } from "../logger";
import { InvalidStateError } from "../errors/AppError";

let activeExportJob: string | null = null;

export class ExportService {
  private hfService: HuggingFaceService;

  constructor(private prisma: PrismaClient) {
    this.hfService = new HuggingFaceService();
  }

  async previewExport(): Promise<PreviewResult> {
    const sentences = await this.prisma.sentence.findMany({
      where: { status: "TRANSLATED", hassaniya: { not: null }, exportedAt: null },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const preview = sentences.map((s) => ({
      arabic: s.arabic,
      hassani: s.hassaniya!,
    }));

    const totalCount = await this.prisma.sentence.count({
      where: { status: "TRANSLATED", hassaniya: { not: null }, exportedAt: null },
    });

    return { preview, count: totalCount };
  }

  async generateJSONL(): Promise<string> {
    const sentences = await this.prisma.sentence.findMany({
      where: { status: "TRANSLATED", hassaniya: { not: null } },
      orderBy: { createdAt: "asc" },
    });

    const rows: DatasetRow[] = sentences.map((s) => ({
      arabic: s.arabic,
      hassani: s.hassaniya!,
    }));

    return rows.map((row) => JSON.stringify(row)).join("\n");
  }

  async getExportStatus(jobId?: string): Promise<ExportStatus> {
    const id = jobId || "latest";

    const lastExported = await this.prisma.sentence.findFirst({
      where: { exportedAt: { not: null } },
      orderBy: { exportedAt: "desc" },
      select: { exportedAt: true },
    });

    const exportedCount = await this.prisma.sentence.count({
      where: { exportedAt: { not: null } },
    });

    if (!lastExported) {
      return {
        jobId: id,
        status: "COMPLETED",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        totalProcessed: 0,
        failedItems: [],
        error: null,
      };
    }

    return {
      jobId: id,
      status: "COMPLETED",
      startedAt: lastExported.exportedAt!.toISOString(),
      completedAt: lastExported.exportedAt!.toISOString(),
      totalProcessed: exportedCount,
      failedItems: [],
      error: null,
    };
  }

  async exportToHuggingFace(requestId?: string): Promise<ExportResult> {
    if (activeExportJob) {
      throw new Error("Export job already in progress");
    }

    const jobId = `exp_${Date.now()}`;
    activeExportJob = jobId;

    logger.info("Export started", { jobId }, requestId);

    try {
      const translatedCount = await this.prisma.sentence.count({
        where: { status: "TRANSLATED", hassaniya: { not: null }, exportedAt: null },
      });

      if (translatedCount === 0) {
        throw new Error("No untranslated sentences to export. All translated sentences have already been exported.");
      }

      const sentences = await this.prisma.sentence.findMany({
        where: { status: "TRANSLATED", hassaniya: { not: null }, exportedAt: null },
        orderBy: { createdAt: "asc" },
      });

      const rowsWithIds = sentences.map((s) => ({
        id: s.id,
        row: {
          arabic: s.arabic,
          hassani: s.hassaniya!,
        },
      }));

      let datasetSizeBefore = 0;
      let existing = "";

      try {
        existing = await this.hfService.downloadDataset();
        datasetSizeBefore = this.hfService.countDatasetRows(existing);

        logger.info("Datasets merged", {
          existingRows: datasetSizeBefore,
          newRows: rowsWithIds.length,
        }, requestId);
      } catch (err) {
        logger.warn("Could not download existing dataset, uploading new", {}, requestId);
      }

      const existingKeys = this.hfService.getExistingKeys(existing);
      const uniqueRowsWithIds = rowsWithIds.filter(({ row }) => {
        return !existingKeys.has(this.hfService.rowKey(row));
      });

      if (uniqueRowsWithIds.length === 0) {
        throw new InvalidStateError("This batch has already been exported to Hugging Face.");
      }

      const newData = uniqueRowsWithIds.map(({ row }) => JSON.stringify(row)).join("\n");
      const mergedData = this.hfService.mergeDatasets(existing, newData);

      await this.hfService.uploadDataset(mergedData);

      const datasetSizeAfter = this.hfService.countDatasetRows(mergedData);

      const sentenceIds = uniqueRowsWithIds.map(({ id }) => id);
      await this.prisma.$transaction(
        sentenceIds.map((id) =>
          this.prisma.sentence.update({
            where: { id },
            data: { exportedAt: new Date() },
          })
        )
      );

      const duplicatesRemoved = rowsWithIds.length - uniqueRowsWithIds.length;

      logger.info("Export completed", {
        jobId,
        sentencesExported: uniqueRowsWithIds.length,
        datasetSizeBefore,
        datasetSizeAfter,
        duplicatesRemoved,
      }, requestId);

      return {
        jobId,
        status: "COMPLETED",
        message: "Export completed successfully",
        sentencesExported: uniqueRowsWithIds.length,
        datasetSizeBefore,
        datasetSizeAfter,
        duplicatesRemoved,
      };
    } catch (error) {
      logger.error("Export failed", error, requestId);
      throw error;
    } finally {
      activeExportJob = null;
    }
  }

  getActiveJob(): string | null {
    return activeExportJob;
  }
}
