type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

function createEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  requestId?: string
): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>, requestId?: string) => {
    const entry = createEntry("info", message, data, requestId);
    console.log(formatEntry(entry));
  },

  warn: (message: string, data?: Record<string, unknown>, requestId?: string) => {
    const entry = createEntry("warn", message, data, requestId);
    console.warn(formatEntry(entry));
  },

  error: (message: string, error?: unknown, requestId?: string) => {
    const data = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    const entry = createEntry("error", message, data, requestId);
    console.error(formatEntry(entry));
  },

  debug: (message: string, data?: Record<string, unknown>, requestId?: string) => {
    if (process.env.NODE_ENV === "development") {
      const entry = createEntry("debug", message, data, requestId);
      console.debug(formatEntry(entry));
    }
  },
};
