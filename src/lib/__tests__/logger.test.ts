import { logger } from "../logger";

describe("Logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(console, "debug").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log info messages", () => {
    logger.info("test message", { key: "value" });
    expect(console.log).toHaveBeenCalled();
    const output = JSON.parse((console.log as jest.Mock).mock.calls[0][0]);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.data.key).toBe("value");
  });

  it("should log warn messages", () => {
    logger.warn("warning message");
    expect(console.warn).toHaveBeenCalled();
    const output = JSON.parse((console.warn as jest.Mock).mock.calls[0][0]);
    expect(output.level).toBe("warn");
  });

  it("should log error messages", () => {
    logger.error("error message", new Error("test error"));
    expect(console.error).toHaveBeenCalled();
    const output = JSON.parse((console.error as jest.Mock).mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.data.error).toBe("test error");
  });

  it("should include requestId", () => {
    logger.info("with request", {}, "req_123");
    const output = JSON.parse((console.log as jest.Mock).mock.calls[0][0]);
    expect(output.requestId).toBe("req_123");
  });
});
