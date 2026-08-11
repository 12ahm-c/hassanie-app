"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QaPairDTO } from "@/types";

interface EditQaModalProps {
  pair: QaPairDTO;
  onSave: (id: number, question: string, answer: string) => Promise<void>;
  onClose: () => void;
}

export function EditQaModal({ pair, onSave, onClose }: EditQaModalProps) {
  const [question, setQuestion] = useState(pair.question);
  const [answer, setAnswer] = useState(pair.answer);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave(pair.id, question, answer);
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
        <h2 className="text-lg font-semibold text-gray-900">
          تعديل سؤال وجواب
        </h2>

        <div className="mt-4">
          <Textarea
            label="السؤال"
            placeholder="أدخل السؤال..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="الجواب"
            placeholder="أدخل الجواب..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
