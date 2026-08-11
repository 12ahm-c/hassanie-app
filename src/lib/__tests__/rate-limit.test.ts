import { checkRateLimit, getRateLimitHeaders } from "../rate-limit";

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("Rate Limiter", () => {
  it("should allow requests within limit", () => {
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("should block requests over limit", () => {
    const ip = "192.168.1.2";
    for (let i = 0; i < 100; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should return correct headers", () => {
    const headers = getRateLimitHeaders("192.168.1.3");
    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
    expect(headers["X-RateLimit-Policy"]).toBe("100;w=60");
  });
});
