import { StatisticsService } from "../statistics.service";
import { PrismaClient } from "@prisma/client";
import { HuggingFaceService } from "../huggingface.service";

jest.mock("@prisma/client");
jest.mock("../huggingface.service", () => ({
  HuggingFaceService: jest.fn().mockImplementation(() => {
    const actual = new (jest.requireActual("../huggingface.service").HuggingFaceService)({
      token: "hf_test_token",
      repo: "test/repo",
    });
    return {
      downloadDataset: jest.fn().mockResolvedValue(""),
      countDatasetRows: actual.countDatasetRows.bind(actual),
      parseDatasetRows: actual.parseDatasetRows.bind(actual),
    };
  }),
}));

const mockPrisma = {
  sentence: {
    count: jest.fn(),
    findFirst: jest.fn(),
  },
} as unknown as PrismaClient;

const service = new StatisticsService(mockPrisma);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StatisticsService", () => {
  describe("getDashboardStats", () => {
    it("should return correct dashboard stats", async () => {
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(950)
        .mockResolvedValueOnce(45);
      (mockPrisma.sentence.findFirst as jest.Mock).mockResolvedValue({
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

    it("should use Hugging Face total as the dashboard total when dataset is available", async () => {
      const actual = new (jest.requireActual("../huggingface.service").HuggingFaceService)({
        token: "hf_test_token",
        repo: "test/repo",
      });
      (HuggingFaceService as jest.Mock).mockImplementationOnce(() => ({
        downloadDataset: jest.fn().mockResolvedValue(
          '{"arabic":"a","hassani":"b"}\n{"arabic":"c","hassani":"d"}'
        ),
        countDatasetRows: actual.countDatasetRows.bind(actual),
        parseDatasetRows: actual.parseDatasetRows.bind(actual),
      }));
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(950)
        .mockResolvedValueOnce(45);
      (mockPrisma.sentence.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await service.getDashboardStats();

      expect(stats.totalSentences).toBe(2);
      expect(stats.hfTotal).toBe(2);
    });

    it("should return null lastExportAt when no exports", async () => {
      (mockPrisma.sentence.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (mockPrisma.sentence.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await service.getDashboardStats();

      expect(stats.totalSentences).toBe(0);
      expect(stats.lastExportAt).toBeNull();
      expect(stats.hfTotal).toBe(0);
    });
  });
});
