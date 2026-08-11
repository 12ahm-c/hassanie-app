import { prisma } from "@/lib/db/prisma";
import { StatisticsService } from "@/lib/services/statistics.service";

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    sentence: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/huggingface.service", () => ({
  HuggingFaceService: jest.fn().mockImplementation(() => ({
    downloadDataset: jest.fn().mockResolvedValue(""),
  })),
}));

const mockPrisma = prisma as any;
const service = new StatisticsService(mockPrisma);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/stats", () => {
  it("should return dashboard statistics", async () => {
    mockPrisma.sentence.count
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(950)
      .mockResolvedValueOnce(45);
    mockPrisma.sentence.findFirst.mockResolvedValue({
      exportedAt: new Date("2026-08-07T12:00:00.000Z"),
    });

    const stats = await service.getDashboardStats();

    expect(stats.totalSentences).toBe(1000);
    expect(stats.translated).toBe(50);
    expect(stats.pending).toBe(950);
    expect(stats.exported).toBe(45);
    expect(stats.lastExportAt).toBe("2026-08-07T12:00:00.000Z");
    expect(stats.hfTotal).toBe(0);
  });

  it("should handle no exports", async () => {
    mockPrisma.sentence.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockPrisma.sentence.findFirst.mockResolvedValue(null);

    const stats = await service.getDashboardStats();

    expect(stats.totalSentences).toBe(0);
    expect(stats.lastExportAt).toBeNull();
  });

  it("should handle database errors", async () => {
    mockPrisma.sentence.count.mockRejectedValue(new Error("DB error"));

    await expect(service.getDashboardStats()).rejects.toThrow("DB error");
  });
});
