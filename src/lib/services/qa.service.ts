import { PrismaClient, Prisma, QaPair } from "@prisma/client";
import {
  QaPairDTO,
  QaBatchResult,
  QaFilters,
  QaStatus,
  PaginatedResult,
} from "@/types";

export class QaService {
  constructor(private prisma: PrismaClient) {}

  async createBatch(
    pairs: { question: string; answer: string }[]
  ): Promise<QaBatchResult> {
    const normalized = pairs.map((p) => ({
      question: p.question.trim(),
      answer: p.answer.trim(),
    }));

    const uniqueKeys = new Set(normalized.map((p) => `${p.question}|||${p.answer}`));
    const unique = [...uniqueKeys].map((key) => {
      const [question, answer] = key.split("|||");
      return { question, answer };
    });

    const existing = await this.prisma.qaPair.findMany({
      where: {
        OR: unique.map((p) => ({
          AND: [{ question: p.question }, { answer: p.answer }],
        })),
      },
      select: { question: true, answer: true },
    });

    const existingSet = new Set(
      existing.map((e) => `${e.question}|||${e.answer}`)
    );

    const toCreate = unique.filter(
      (p) => !existingSet.has(`${p.question}|||${p.answer}`)
    );
    const duplicates = unique
      .filter((p) => existingSet.has(`${p.question}|||${p.answer}`))
      .map((p) => ({
        question: p.question,
        answer: p.answer,
        message: "Skipped: already exists",
      }));

    let created: { id: number; question: string; answer: string }[] = [];

    if (toCreate.length > 0) {
      const result = await this.prisma.$transaction(
        toCreate.map((p) =>
          this.prisma.qaPair.create({
            data: { question: p.question, answer: p.answer, status: "PENDING" },
            select: { id: true, question: true, answer: true },
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

  async createSingle(question: string, answer: string): Promise<QaPair> {
    return this.prisma.qaPair.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        status: "PENDING",
      },
    });
  }

  async findAll(
    filters: QaFilters
  ): Promise<PaginatedResult<QaPairDTO>> {
    const { status, exported, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QaPairWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (exported !== undefined) {
      where.exportedAt = exported ? { not: null } : null;
    }

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
      ];
    }

    const [pairs, total, pendingCount, answeredCount] = await Promise.all([
      this.prisma.qaPair.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.qaPair.count({ where }),
      this.prisma.qaPair.count({ where: { ...where, status: "PENDING" } }),
      this.prisma.qaPair.count({ where: { ...where, status: "ANSWERED" } }),
    ]);

    return {
      data: pairs.map(this.toDTO),
      meta: { page, limit, total, pendingCount, translatedCount: answeredCount },
    };
  }

  async findOne(id: number): Promise<QaPair | null> {
    return this.prisma.qaPair.findUnique({ where: { id } });
  }

  async update(
    id: number,
    question: string,
    answer: string
  ): Promise<QaPair> {
    return this.prisma.qaPair.update({
      where: { id },
      data: {
        question: question.trim(),
        answer: answer.trim(),
      },
    });
  }

  async deleteOne(id: number): Promise<void> {
    await this.prisma.qaPair.delete({ where: { id } });
  }

  async deleteMany(
    filter: { status?: string; exported?: boolean; ids?: number[] } = {}
  ): Promise<{ deletedCount: number }> {
    const where: Prisma.QaPairWhereInput = {};

    if (filter.status && filter.status !== "ALL") {
      where.status = filter.status;
    }

    if (filter.exported !== undefined) {
      where.exportedAt = filter.exported ? { not: null } : null;
    }

    if (filter.ids && filter.ids.length > 0) {
      where.id = { in: filter.ids };
    }

    const result = await this.prisma.qaPair.deleteMany({ where });
    return { deletedCount: result.count };
  }

  private toDTO(pair: QaPair): QaPairDTO {
    return {
      id: pair.id,
      question: pair.question,
      answer: pair.answer,
      status: pair.status as QaStatus,
      exportedAt: pair.exportedAt?.toISOString() ?? null,
      createdAt: pair.createdAt.toISOString(),
      updatedAt: pair.updatedAt.toISOString(),
    };
  }
}
