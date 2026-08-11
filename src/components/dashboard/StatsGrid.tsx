import { StatsCard } from "./StatsCard";
import { DashboardStats } from "@/types";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatsCard label="Total Sentences" value={stats.totalSentences} />
      <StatsCard label="HuggingFace Total" value={stats.hfTotal} variant="default" />
      <StatsCard
        label="Translated"
        value={stats.translated}
        variant="success"
      />
      <StatsCard
        label="Pending"
        value={stats.pending}
        variant="warning"
      />
      <StatsCard label="Exported" value={stats.exported} />
    </div>
  );
}
