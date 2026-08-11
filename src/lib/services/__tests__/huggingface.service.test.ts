import { HuggingFaceService } from "../huggingface.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const service = new HuggingFaceService({
  token: "hf_test_token",
  repo: "test/repo",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("HuggingFaceService", () => {
  describe("downloadDataset", () => {
    it("should ignore root JSONL files and only read data parquet files", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ type: "file", path: "dataset.jsonl", size: 100 }]),
      });

      const content = await service.downloadDataset();

      expect(content).toBe("");
    });

    it("should return empty string when no files exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const content = await service.downloadDataset();

      expect(content).toBe("");
    });

    it("should handle tree API errors gracefully", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const content = await service.downloadDataset();

      expect(content).toBe("");
    });
  });

  describe("mergeDatasets", () => {
    it("should merge and deduplicate datasets", () => {
      const existing = JSON.stringify({ arabic: "a", hassani: "b" });
      const newData = JSON.stringify({ arabic: "a", hassani: "b" }) + "\n" +
        JSON.stringify({ arabic: "c", hassani: "d" });

      const merged = service.mergeDatasets(existing, newData);
      const rows = merged.split("\n").filter((l) => l.trim());

      expect(rows).toHaveLength(2);
    });

    it("should keep all unique rows", () => {
      const existing = JSON.stringify({ arabic: "a", hassani: "b" });
      const newData = JSON.stringify({ arabic: "c", hassani: "d" });

      const merged = service.mergeDatasets(existing, newData);
      const rows = merged.split("\n").filter((l) => l.trim());

      expect(rows).toHaveLength(2);
    });

    it("should handle empty existing dataset", () => {
      const newData = JSON.stringify({ arabic: "a", hassani: "b" });

      const merged = service.mergeDatasets("", newData);
      const rows = merged.split("\n").filter((l) => l.trim());

      expect(rows).toHaveLength(1);
    });
  });
});
