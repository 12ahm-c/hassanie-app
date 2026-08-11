import { PhraseService } from "../phrase.service";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client");

const mockPrisma = {
  sentence: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

const service = new PhraseService(mockPrisma);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PhraseService", () => {
  describe("createBatch", () => {
    it("should create multiple sentences and skip duplicates", async () => {
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue([
        { arabic: "existing" },
      ]);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([
        { id: 1, arabic: "new one" },
        { id: 2, arabic: "another new" },
      ]);

      const result = await service.createBatch([
        "existing",
        "new one",
        "another new",
      ]);

      expect(result.totalCreated).toBe(2);
      expect(result.totalDuplicates).toBe(1);
      expect(result.duplicates[0].arabic).toBe("existing");
      expect(result.created).toHaveLength(2);
    });

    it("should return all duplicates when all exist", async () => {
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue([
        { arabic: "a" },
        { arabic: "b" },
      ]);

      const result = await service.createBatch(["a", "b"]);

      expect(result.totalCreated).toBe(0);
      expect(result.totalDuplicates).toBe(2);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("should deduplicate input phrases", async () => {
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.createBatch(["dup", "dup", "unique"]);

      expect(result.totalCreated).toBe(2);
    });
  });

  describe("createSingle", () => {
    it("should create a single sentence", async () => {
      const sentence = {
        id: 1,
        arabic: "test",
        hassaniya: null,
        status: "PENDING",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.sentence.create as jest.Mock).mockResolvedValue(sentence);

      const result = await service.createSingle("test");

      expect(result.arabic).toBe("test");
      expect(mockPrisma.sentence.create).toHaveBeenCalledWith({
        data: { arabic: "test", status: "PENDING" },
      });
    });
  });

  describe("findOne", () => {
    it("should return a sentence by id", async () => {
      const sentence = {
        id: 1,
        arabic: "test",
        hassaniya: null,
        status: "PENDING",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.sentence.findUnique as jest.Mock).mockResolvedValue(sentence);

      const result = await service.findOne(1);

      expect(result?.id).toBe(1);
    });

    it("should return null if not found", async () => {
      (mockPrisma.sentence.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe("updateTranslation", () => {
    it("should set status to TRANSLATED when hassaniya is provided", async () => {
      (mockPrisma.sentence.update as jest.Mock).mockResolvedValue({
        id: 1,
        arabic: "test",
        hassaniya: "translation",
        status: "TRANSLATED",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateTranslation(1, "translation");

      expect(result.status).toBe("TRANSLATED");
      expect(mockPrisma.sentence.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hassaniya: "translation", status: "TRANSLATED" },
      });
    });

    it("should set status to PENDING when hassaniya is empty", async () => {
      (mockPrisma.sentence.update as jest.Mock).mockResolvedValue({
        id: 1,
        arabic: "test",
        hassaniya: null,
        status: "PENDING",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateTranslation(1, "");

      expect(result.status).toBe("PENDING");
      expect(mockPrisma.sentence.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hassaniya: null, status: "PENDING" },
      });
    });
  });

  describe("deleteOne", () => {
    it("should delete a sentence", async () => {
      (mockPrisma.sentence.delete as jest.Mock).mockResolvedValue({});

      await service.deleteOne(1);

      expect(mockPrisma.sentence.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("deleteMany", () => {
    it("should delete matching sentences and return count", async () => {
      (mockPrisma.sentence.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const result = await service.deleteMany({ status: "PENDING" });

      expect(result.deletedCount).toBe(5);
    });

    it("should delete by ids", async () => {
      (mockPrisma.sentence.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const result = await service.deleteMany({ ids: [1, 2] });

      expect(result.deletedCount).toBe(2);
      expect(mockPrisma.sentence.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
      });
    });

    it("should delete all when no filter", async () => {
      (mockPrisma.sentence.deleteMany as jest.Mock).mockResolvedValue({
        count: 100,
      });

      const result = await service.deleteMany();

      expect(result.deletedCount).toBe(100);
      expect(mockPrisma.sentence.deleteMany).toHaveBeenCalledWith({
        where: {},
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated results with counts", async () => {
      const sentences = [
        {
          id: 1,
          arabic: "test",
          hassaniya: "trans",
          status: "TRANSLATED",
          exportedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue(sentences);
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(10);
      expect(result.meta.pendingCount).toBe(3);
      expect(result.meta.translatedCount).toBe(7);
    });

    it("should filter by status", async () => {
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.findAll({ status: "PENDING" });

      expect(mockPrisma.sentence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PENDING" }),
        })
      );
    });

    it("should search in arabic text", async () => {
      (mockPrisma.sentence.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.findAll({ search: "court" });

      expect(mockPrisma.sentence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            arabic: { contains: "court" },
          }),
        })
      );
    });
  });
});
