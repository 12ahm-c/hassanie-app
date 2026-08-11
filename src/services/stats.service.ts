import { apiClient } from "@/lib/api/client";
import { DashboardStats } from "@/types";

export const statsService = {
  getStats: () => apiClient.get<DashboardStats>("/stats"),
};
