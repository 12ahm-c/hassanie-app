import { ExportService } from "../export.service";
import { HuggingFaceService } from "../huggingface.service";

jest.mock("../huggingface.service", () => ({
  HuggingFaceService: jest.fn().mockImplementation(() => {
    const actual = new (jest.requireActual("../huggingface.service").HuggingFaceService)({
      token: "hf_test_token",
      repo: "test/repo",
    });
    return {
      downloadDataset: jest.fn().mockResolvedValue(""),
      uploadDataset: jest.fn().mockResolvedValue(undefined),
      mergeDatasets: actual.mergeDatasets.bind(actual),
      countDatasetRows: actual.countDatasetRows.bind(actual),
      getExistingKeys: actual.getExistingKeys.bind(actual),
      rowKey: actual.rowKey.bind(actual),
      parseDatasetRows: actual.parseDatasetRows.bind(actual),
    };
  }),
}));

const mockPrisma = {
  sentence: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const service = new ExportService(mockPrisma as any);

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockResolvedValue([]);
});

describe("ExportService", () => {
  describe("previewExport", () => {
    it("should return first 10 translated sentences", async () => {
      const sentences = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        arabic: `arabic ${i}`,
        hassaniya: `hassani ${i}`,
        status: "TRANSLATED",
        exportedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockPrisma.sentence.findMany.mockResolvedValue(sentences);
      mockPrisma.sentence.count.mockResolvedValue(50);

      const result = await service.previewExport();

      expect(result.preview).toHaveLength(10);
      expect(result.count).toBe(50);
      expect(result.preview[0].arabic).toBe("arabic 0");
      expect(result.preview[0].hassani).toBe("hassani 0");
    });

    it("should return empty preview when no translations", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([]);
      mockPrisma.sentence.count.mockResolvedValue(0);

      const result = await service.previewExport();

      expect(result.preview).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  describe("generateJSONL", () => {
    it("should generate valid JSONL", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([
        {
          id: 1,
          arabic: "test1",
          hassaniya: "trans1",
          status: "TRANSLATED",
          exportedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          arabic: "test2",
          hassaniya: "trans2",
          status: "TRANSLATED",
          exportedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const jsonl = await service.generateJSONL();
      const lines = jsonl.split("\n").filter((l) => l.trim());

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ arabic: "test1", hassani: "trans1" });
      expect(JSON.parse(lines[1])).toEqual({ arabic: "test2", hassani: "trans2" });
    });

    it("should return empty string when no translations", async () => {
      mockPrisma.sentence.findMany.mockResolvedValue([]);

      const jsonl = await service.generateJSONL();

      expect(jsonl).toBe("");
    });
  });

  describe("getExportStatus", () => {
    it("should return status with last export date", async () => {
      mockPrisma.sentence.findFirst.mockResolvedValue({
        exportedAt: new Date("2026-08-07T12:00:00.000Z"),
      });
      mockPrisma.sentence.count.mockResolvedValue(45);

      const status = await service.getExportStatus("job_123");

      expect(status.jobId).toBe("job_123");
      expect(status.status).toBe("COMPLETED");
      expect(status.totalProcessed).toBe(45);
      expect(status.completedAt).toBe("2026-08-07T12:00:00.000Z");
    });

    it("should return default status when no exports", async () => {
      mockPrisma.sentence.findFirst.mockResolvedValue(null);
      mockPrisma.sentence.count.mockResolvedValue(0);

      const status = await service.getExportStatus();

      expect(status.status).toBe("COMPLETED");
      expect(status.totalProcessed).toBe(0);
    });
  });

  describe("getActiveJob", () => {
    it("should return null when no job is active", () => {
      expect(service.getActiveJob()).toBeNull();
    });
  });

  describe("exportToHuggingFace", () => {
    it("should append only new rows to the existing Hugging Face dataset", async () => {
      const existing = JSON.stringify({ arabic: "old", hassani: "old-h" });
      const uploadDataset = jest.fn().mockResolvedValue(undefined);
      const actual = new (jest.requireActual("../huggingface.service").HuggingFaceService)({
        token: "hf_test_token",
        repo: "test/repo",
      });
      (HuggingFaceService as jest.Mock).mockImplementationOnce(() => ({
        downloadDataset: jest.fn().mockResolvedValue(existing),
        uploadDataset,
        mergeDatasets: actual.mergeDatasets.bind(actual),
        countDatasetRows: actual.countDatasetRows.bind(actual),
        getExistingKeys: actual.getExistingKeys.bind(actual),
        rowKey: actual.rowKey.bind(actual),
        parseDatasetRows: actual.parseDatasetRows.bind(actual),
      }));
      const freshService = new ExportService(mockPrisma as any);

      mockPrisma.sentence.count.mockResolvedValue(1);
      mockPrisma.sentence.findMany.mockResolvedValue([
        {
          id: 2,
          arabic: "new",
          hassaniya: "new-h",
          status: "TRANSLATED",
          exportedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await freshService.exportToHuggingFace();
      const uploaded = uploadDataset.mock.calls[0][0];

      expect(result.sentencesExported).toBe(1);
      expect(result.datasetSizeBefore).toBe(1);
      expect(result.datasetSizeAfter).toBe(2);
      expect(uploaded.split("\n").filter((line: string) => line.trim())).toHaveLength(2);
      expect(mockPrisma.sentence.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { exportedAt: expect.any(Date) },
      });
    });

    it("should reject a batch that is already present on Hugging Face", async () => {
      const existing = JSON.stringify({ arabic: "same", hassani: "same-h" });
      const uploadDataset = jest.fn().mockResolvedValue(undefined);
      const actual = new (jest.requireActual("../huggingface.service").HuggingFaceService)({
        token: "hf_test_token",
        repo: "test/repo",
      });
      (HuggingFaceService as jest.Mock).mockImplementationOnce(() => ({
        downloadDataset: jest.fn().mockResolvedValue(existing),
        uploadDataset,
        mergeDatasets: actual.mergeDatasets.bind(actual),
        countDatasetRows: actual.countDatasetRows.bind(actual),
        getExistingKeys: actual.getExistingKeys.bind(actual),
        rowKey: actual.rowKey.bind(actual),
        parseDatasetRows: actual.parseDatasetRows.bind(actual),
      }));
      const freshService = new ExportService(mockPrisma as any);

      mockPrisma.sentence.count.mockResolvedValue(1);
      mockPrisma.sentence.findMany.mockResolvedValue([
        {
          id: 1,
          arabic: "same",
          hassaniya: "same-h",
          status: "TRANSLATED",
          exportedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(freshService.exportToHuggingFace()).rejects.toThrow(
        "This batch has already been exported to Hugging Face."
      );
      expect(uploadDataset).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
