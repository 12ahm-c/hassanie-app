"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SentenceDTO } from "@/types";

interface EditTranslationModalProps {
  sentence: SentenceDTO;
  onSave: (id: number, hassaniya: string) => Promise<void>;
  onClose: () => void;
}

export function EditTranslationModal({
  sentence,
  onSave,
  onClose,
}: EditTranslationModalProps) {
  const [hassaniya, setHassaniya] = useState(sentence.hassaniya || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave(sentence.id, hassaniya);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setHassaniya("");
    setIsLoading(true);
    setError(null);
    try {
      await onSave(sentence.id, "");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit Translation</h2>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Arabic Text
          </label>
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            {sentence.arabic}
          </p>
        </div>

        <div className="mt-4">
          <Textarea
            label="Hassaniya Translation"
            placeholder="Enter Hassaniya translation..."
            value={hassaniya}
            onChange={(e) => setHassaniya(e.target.value)}
            error={error || undefined}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClear} isLoading={isLoading}>
            Clear
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
