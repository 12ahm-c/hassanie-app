"use client";

import { useEffect, useState } from "react";
import { useQaStore } from "@/store/qaStore";
import { QaTable } from "@/components/qa/QaTable";
import { QaFilters } from "@/components/qa/QaFilters";
import { EditQaModal } from "@/components/qa/EditQaModal";
import { Pagination } from "@/components/shared/Pagination";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { QaPairDTO } from "@/types";

export default function QaPage() {
  const store = useQaStore();

  const pairs = store.pairs || [];
  const pagination = store.pagination || { page: 1, limit: 20, total: 0 };
  const isLoading = store.isLoading || false;
  const error = store.error || null;
  const fetchPairs = store.fetchPairs;
  const updatePair = store.updatePair;
  const deletePair = store.deletePair;
  const setPage = store.setPage;

  const [editingPair, setEditingPair] = useState<QaPairDTO | null>(null);

  useEffect(() => {
    if (fetchPairs) {
      fetchPairs();
    }
  }, [fetchPairs]);

  const handleEdit = async (id: number, question: string, answer: string) => {
    await updatePair(id, question, answer);
  };

  const handleDelete = async (id: number) => {
    await deletePair(id);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export/qa-hf", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        alert(
          `تم التصدير بنجاح! تم تصدير ${json.data.pairsExported} زوج سؤال وجواب`
        );
        fetchPairs();
      } else {
        alert(json.error?.message || "حدث خطأ أثناء التصدير");
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء التصدير");
    }
  };

  if (isLoading && pairs.length === 0) {
    return <LoadingSpinner className="py-12" />;
  }

  if (error && pairs.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchPairs()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          أسئلة وأجوبة حسانية
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Export to HuggingFace
          </button>
          <a
            href="/qa/add"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add Q&A Pairs
          </a>
        </div>
      </div>

      <QaFilters />

      {pairs.length === 0 ? (
        <EmptyState
          title="No Q&A pairs found"
          description="Add Hassaniya question & answer pairs to get started."
          action={
            <a
              href="/qa/add"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add Q&A Pairs
            </a>
          }
        />
      ) : (
        <>
          <QaTable
            pairs={pairs}
            onEdit={setEditingPair}
            onDelete={handleDelete}
          />
          <Pagination
            page={pagination.page || 1}
            limit={pagination.limit || 20}
            total={pagination.total || 0}
            onPageChange={setPage}
          />
        </>
      )}

      {editingPair && (
        <EditQaModal
          pair={editingPair}
          onSave={handleEdit}
          onClose={() => setEditingPair(null)}
        />
      )}
    </div>
  );
}
