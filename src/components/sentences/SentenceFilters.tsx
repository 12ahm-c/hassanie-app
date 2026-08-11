"use client";

import { Input } from "@/components/ui/input";
import { useSentenceStore } from "@/store/sentenceStore";

export function SentenceFilters() {
  const { filters, setFilter, clearFilters } = useSentenceStore();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="w-48">
        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
        <select
          value={filters.status || ""}
          onChange={(e) => setFilter("status", e.target.value || undefined)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="TRANSLATED">Translated</option>
        </select>
      </div>

      <div className="w-48">
        <label className="mb-1 block text-sm font-medium text-gray-700">Exported</label>
        <select
          value={filters.exported === undefined ? "" : String(filters.exported)}
          onChange={(e) =>
            setFilter(
              "exported",
              e.target.value === "" ? undefined : e.target.value === "true"
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Exported</option>
          <option value="false">Not Exported</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Input
          label="Search Arabic"
          placeholder="Search in Arabic text..."
          value={filters.search || ""}
          onChange={(e) => setFilter("search", e.target.value || undefined)}
        />
      </div>

      <div className="flex items-end">
        <button
          onClick={clearFilters}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
