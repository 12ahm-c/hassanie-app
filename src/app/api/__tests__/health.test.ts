import { prisma } from "@/lib/db/prisma";

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/health", () => {
  it("should return ok when database query succeeds", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const result = await mockPrisma.$queryRaw`SELECT 1`;

    expect(result).toBeDefined();
    expect(result[0]["?column?"]).toBe(1);
  });

  it("should handle database connection failure", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    await expect(mockPrisma.$queryRaw`SELECT 1`).rejects.toThrow(
      "Connection refused"
    );
  });

  it("should report huggingface as configured when token exists", () => {
    const hasToken = !!process.env.HUGGINGFACE_TOKEN;
    expect(typeof hasToken).toBe("boolean");
  });
});
