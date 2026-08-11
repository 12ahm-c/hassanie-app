import { PrismaClient, Prisma, Sentence } from "@prisma/client";
import {
  BatchResult,
  PaginatedResult,
  SentenceDTO,
  SentenceFilters,
  DeleteManyFilter,
  Status,
} from "@/types";

export class PhraseService {
  constructor(private prisma: PrismaClient) {}

  async createBatch(phrases: string[]): Promise<BatchResult> {
    const trimmed = phrases.map((p) => p.trim());
    const unique = [...new Set(trimmed)];

    const existing = await this.prisma.sentence.findMany({
      where: { arabic: { in: unique } },
      select: { arabic: true },
    });
    const existingSet = new Set(existing.map((e) => e.arabic));

    const toCreate = unique.filter((a) => !existingSet.has(a));
    const duplicates = unique
      .filter((a) => existingSet.has(a))
      .map((arabic) => ({ arabic, message: "Skipped: already exists" }));

    let created: { id: number; arabic: string }[] = [];

    if (toCreate.length > 0) {
      const result = await this.prisma.$transaction(
        toCreate.map((arabic) =>
          this.prisma.sentence.create({
            data: { arabic, status: "PENDING" },
            select: { id: true, arabic: true },
          })
        )
      );
      created = result;
    }

    return {
      created,
      duplicates,
      totalCreated: created.length,
      totalDuplicates: duplicates.length,
    };
  }

  async createSingle(arabic: string): Promise<Sentence> {
    const trimmed = arabic.trim();
    return this.prisma.sentence.create({
      data: { arabic: trimmed, status: "PENDING" },
    });
  }

  async findAll(filters: SentenceFilters): Promise<PaginatedResult<SentenceDTO>> {
    const { status, exported, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SentenceWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (exported !== undefined) {
      where.exportedAt = exported ? { not: null } : null;
    }

    if (search) {
      where.arabic = { contains: search };
    }

    const [sentences, total, pendingCount, translatedCount] = await Promise.all([
      this.prisma.sentence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.sentence.count({ where }),
      this.prisma.sentence.count({ where: { ...where, status: "PENDING" } }),
      this.prisma.sentence.count({ where: { ...where, status: "TRANSLATED" } }),
    ]);

    return {
      data: sentences.map(this.toDTO),
      meta: { page, limit, total, pendingCount, translatedCount },
    };
  }

  async findOne(id: number): Promise<Sentence | null> {
    return this.prisma.sentence.findUnique({ where: { id } });
  }

  async updateTranslation(id: number, hassaniya: string): Promise<Sentence> {
    const trimmed = hassaniya.trim();
    const status: Status = trimmed.length > 0 ? "TRANSLATED" : "PENDING";

    return this.prisma.sentence.update({
      where: { id },
      data: { hassaniya: trimmed || null, status },
    });
  }

  async deleteOne(id: number): Promise<void> {
    await this.prisma.sentence.delete({ where: { id } });
  }

  async deleteMany(filter: DeleteManyFilter = {}): Promise<{ deletedCount: number }> {
    const where: Prisma.SentenceWhereInput = {};

    if (filter.status && filter.status !== "ALL") {
      where.status = filter.status;
    }

    if (filter.exported !== undefined) {
      where.exportedAt = filter.exported ? { not: null } : null;
    }

    if (filter.ids && filter.ids.length > 0) {
      where.id = { in: filter.ids };
    }

    const result = await this.prisma.sentence.deleteMany({ where });
    return { deletedCount: result.count };
  }

  private toDTO(sentence: Sentence): SentenceDTO {
    return {
      id: sentence.id,
      arabic: sentence.arabic,
      hassaniya: sentence.hassaniya,
      status: sentence.status as Status,
      exportedAt: sentence.exportedAt?.toISOString() ?? null,
      createdAt: sentence.createdAt.toISOString(),
      updatedAt: sentence.updatedAt.toISOString(),
    };
  }
}
