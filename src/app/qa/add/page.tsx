"use client";

import { useState } from "react";
import { useQaStore } from "@/store/qaStore";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AddQaPage() {
  const { addPairs, isLoading } = useQaStore();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    created: number;
    duplicates: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setError("Please enter at least one Q&A pair.");
      return;
    }

    if (lines.length % 2 !== 0) {
      setError(
        "Invalid format: each question must be followed by its answer. You have an odd number of lines."
      );
      return;
    }

    const pairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < lines.length; i += 2) {
      pairs.push({
        question: lines[i],
        answer: lines[i + 1],
      });
    }

    setError(null);
    try {
      const batchResult = await addPairs(pairs);
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
        <h1 className="text-2xl font-bold text-gray-900">
          إضافة أسئلة وأجوبة
        </h1>
        <a href="/qa" className="text-sm text-blue-600 hover:text-blue-800">
          Back to list
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إدخال دفعة واحدة - سؤال وجواب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>الشكل:</strong> كل سؤال في سطر وكل جواب تحته مباشرة.
              <br />
              <strong>مثال:</strong>
            </p>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-blue-700">
              {`كيف حالك؟
بخير والحمد لله
ما اسمك؟
اسمي أحمد
أين تسكن؟
أسكن في نواكشوط`}
            </pre>
          </div>

          <Textarea
            label="أسئلة وأجوبة (سؤال في سطر، جوابه تحته)"
            placeholder={"كيف حالك؟\nبخير والحمد لله\nما اسمك؟\nاسمي أحمد"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[250px]"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                <strong>{result.created}</strong> أزواج تم إضافتهم بنجاح.
                {result.duplicates > 0 && (
                  <>
                    {" "}
                    <strong>{result.duplicates}</strong> مكررات تم تخطيهم.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Add Q&A Pairs
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
