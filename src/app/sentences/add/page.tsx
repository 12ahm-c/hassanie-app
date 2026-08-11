"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSentenceStore } from "@/store/sentenceStore";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AddSentencesPage() {
  const router = useRouter();
  const { addSentences, isLoading } = useSentenceStore();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    created: number;
    duplicates: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const phrases = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (phrases.length === 0) {
      setError("Please enter at least one sentence.");
      return;
    }

    setError(null);
    try {
      const batchResult = await addSentences(phrases);
      setResult({
        created: batchResult.totalCreated,
        duplicates: batchResult.totalDuplicates,
      });
      setInput("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add Sentences</h1>
        <a
          href="/sentences"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to list
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Add Arabic Sentences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Arabic sentences (one per line)"
            placeholder={"Enter Arabic sentences here...\nOne sentence per line.\n\nExample:\nالمحكمة رفضت قبول شهادة الأخ\nقضية إبطال وصية المتوفى"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px]"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {result && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                <strong>{result.created}</strong> sentences added successfully.
                {result.duplicates > 0 && (
                  <> <strong>{result.duplicates}</strong> duplicates skipped.</>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Add Sentences
            </Button>
            <Button variant="outline" onClick={() => setInput("")}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
