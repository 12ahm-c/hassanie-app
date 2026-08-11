import { prisma } from "@/lib/db/prisma";
import { PhraseService } from "@/lib/services/phrase.service";

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
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
  },
}));

const mockPrisma = prisma as any;
const service = new PhraseService(mockPrisma);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Sentence API Integration", () => {
  describe("POST /sentences/batch", () => {
    it("should create multiple sentences", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([
        { id: 1, arabic: "hello" },
        { id: 2, arabic: "world" },
      ]);

      const result = await service.createBatch(["hello", "world"]);

      expect(result.totalCreated).toBe(2);
      expect(result.totalDuplicates).toBe(0);
    });

    it("should skip duplicates", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([{ arabic: "hello" }]);
      mockPrisma.$transaction.mockResolvedValue([{ id: 1, arabic: "world" }]);

      const result = await service.createBatch(["hello", "world"]);

      expect(result.totalCreated).toBe(1);
      expect(result.totalDuplicates).toBe(1);
    });
  });

  describe("POST /sentences", () => {
    it("should create a single sentence", async () => {
      mockPrisma.sentence.create.mockResolvedValue({
        id: 1,
        arabic: "test",
        hassaniya: null,
        status: "PENDING",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createSingle("test");

      expect(result.arabic).toBe("test");
      expect(result.status).toBe("PENDING");
    });
  });

  describe("GET /sentences", () => {
    it("should return paginated results", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([]);
      mockPrisma.sentence.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it("should filter by status", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([]);
      mockPrisma.sentence.count
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
  });

  describe("GET /sentences/:id", () => {
    it("should return a sentence", async () => {
      mockPrisma.sentence.findUnique.mockResolvedValue({
        id: 1,
        arabic: "test",
        hassaniya: null,
        status: "PENDING",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne(1);

      expect(result?.id).toBe(1);
    });

    it("should return null if not found", async () => {
      mockPrisma.sentence.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe("PUT /sentences/:id", () => {
    it("should update translation and set TRANSLATED", async () => {
      mockPrisma.sentence.update.mockResolvedValue({
        id: 1,
        arabic: "test",
        hassaniya: "translated",
        status: "TRANSLATED",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateTranslation(1, "translated");

      expect(result.status).toBe("TRANSLATED");
      expect(result.hassaniya).toBe("translated");
    });

    it("should clear translation and set PENDING", async () => {
      mockPrisma.sentence.update.mockResolvedValue({
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
      expect(result.hassaniya).toBeNull();
    });
  });

  describe("DELETE /sentences/:id", () => {
    it("should delete a sentence", async () => {
      mockPrisma.sentence.delete.mockResolvedValue({});

      await service.deleteOne(1);

      expect(mockPrisma.sentence.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("DELETE /sentences", () => {
    it("should bulk delete with filter", async () => {
      mockPrisma.sentence.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.deleteMany({ status: "PENDING" });

      expect(result.deletedCount).toBe(5);
    });

    it("should delete by ids", async () => {
      mockPrisma.sentence.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.deleteMany({ ids: [1, 2] });

      expect(result.deletedCount).toBe(2);
    });
  });
});
