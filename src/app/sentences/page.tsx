"use client";

import { useEffect, useState } from "react";
import { useSentenceStore } from "@/store/sentenceStore";
import { SentenceTable } from "@/components/sentences/SentenceTable";
import { SentenceFilters } from "@/components/sentences/SentenceFilters";
import { EditTranslationModal } from "@/components/sentences/EditTranslationModal";
import { Pagination } from "@/components/shared/Pagination";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SentenceDTO } from "@/types";

export default function SentencesPage() {
  const store = useSentenceStore();

  const sentences = store.sentences || [];
  const pagination = store.pagination || { page: 1, limit: 20, total: 0 };
  const isLoading = store.isLoading || false;
  const error = store.error || null;
  const fetchSentences = store.fetchSentences;
  const updateTranslation = store.updateTranslation;
  const deleteSentence = store.deleteSentence;
  const setPage = store.setPage;

  const [editingSentence, setEditingSentence] = useState<SentenceDTO | null>(null);

  useEffect(() => {
    if (fetchSentences) {
      fetchSentences();
    }
  }, [fetchSentences]);

  const handleEdit = async (id: number, hassaniya: string) => {
    await updateTranslation(id, hassaniya);
  };

  const handleDelete = async (id: number) => {
    await deleteSentence(id);
  };

  if (isLoading && sentences.length === 0) {
    return <LoadingSpinner className="py-12" />;
  }

  if (error && sentences.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchSentences()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sentences</h1>
        <a
          href="/sentences/add"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Add Sentences
        </a>
      </div>

      <SentenceFilters />

      {sentences.length === 0 ? (
        <EmptyState
          title="No sentences found"
          description="Add some Arabic sentences to get started."
          action={
            <a
              href="/sentences/add"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add Sentences
            </a>
          }
        />
      ) : (
        <>
          <SentenceTable
            sentences={sentences}
            onEdit={setEditingSentence}
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

      {editingSentence && (
        <EditTranslationModal
          sentence={editingSentence}
          onSave={handleEdit}
          onClose={() => setEditingSentence(null)}
        />
      )}
    </div>
  );
}
