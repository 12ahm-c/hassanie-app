const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: any;
  meta: any;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return { success: true, data: undefined as T, error: null, meta: null };
  }

  const json = await res.json();

  if (!json.success) {
    const error = new Error(json.error?.message || "Request failed");
    (error as any).code = json.error?.code;
    (error as any).statusCode = res.status;
    (error as any).fields = json.error?.fields;
    throw error;
  }

  return json;
}

export const apiClient = {
  get: async <T>(path: string, params?: Record<string, any>): Promise<T> => {
    const response = await request<T>(path, { params });
    return response.data;
  },

  getPaginated: async <T>(path: string, params?: Record<string, any>) => {
    const response = await request<T[]>(path, { params });
    return { data: response.data, meta: response.meta };
  },

  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await request<T>(path, { method: "POST", body });
    return response.data;
  },

  put: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await request<T>(path, { method: "PUT", body });
    return response.data;
  },

  delete: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await request<T>(path, { method: "DELETE", body });
    return response.data;
  },
};
