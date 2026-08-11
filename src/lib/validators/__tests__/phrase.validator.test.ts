import {
  createBatchSchema,
  createSingleSchema,
  findAllSchema,
  updateTranslationSchema,
  deleteManySchema,
} from "../phrase.validator";

describe("Phrase Validators", () => {
  describe("createBatchSchema", () => {
    it("should accept valid batch", () => {
      const result = createBatchSchema.safeParse({ phrases: ["hello", "world"] });
      expect(result.success).toBe(true);
    });

    it("should reject empty array", () => {
      const result = createBatchSchema.safeParse({ phrases: [] });
      expect(result.success).toBe(false);
    });

    it("should reject more than 100 phrases", () => {
      const result = createBatchSchema.safeParse({ phrases: Array(101).fill("a") });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace from phrases", () => {
      const result = createBatchSchema.safeParse({ phrases: ["  hello  "] });
      if (result.success) {
        expect(result.data.phrases[0]).toBe("hello");
      }
    });
  });

  describe("createSingleSchema", () => {
    it("should accept valid arabic text", () => {
      const result = createSingleSchema.safeParse({ arabic: "مرحبا" });
      expect(result.success).toBe(true);
    });

    it("should reject empty string", () => {
      const result = createSingleSchema.safeParse({ arabic: "" });
      expect(result.success).toBe(false);
    });

    it("should reject single character", () => {
      const result = createSingleSchema.safeParse({ arabic: "a" });
      expect(result.success).toBe(false);
    });
  });

  describe("findAllSchema", () => {
    it("should apply default values", () => {
      const result = findAllSchema.safeParse({});
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should parse exported as boolean", () => {
      const result = findAllSchema.safeParse({ exported: "true" });
      if (result.success) {
        expect(result.data.exported).toBe(true);
      }
    });

    it("should reject limit > 100", () => {
      const result = findAllSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTranslationSchema", () => {
    it("should accept valid translation", () => {
      const result = updateTranslationSchema.safeParse({
        hassaniya: "ترجمة",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty translation", () => {
      const result = updateTranslationSchema.safeParse({ hassaniya: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteManySchema", () => {
    it("should accept empty filter", () => {
      const result = deleteManySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept valid filter", () => {
      const result = deleteManySchema.safeParse({
        filter: { status: "PENDING", exported: false },
      });
      expect(result.success).toBe(true);
    });

    it("should accept ids filter", () => {
      const result = deleteManySchema.safeParse({
        filter: { ids: [1, 2, 3] },
      });
      expect(result.success).toBe(true);
    });
  });
});
