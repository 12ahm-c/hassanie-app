"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Sparkles, Upload, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cleanMonoSentences } from "@/lib/mono-cleaner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface UploadResult {
  repo: string;
  uploaded: number;
  cleaned: number;
  duplicatesRemoved: number;
  datasetSizeBefore: number | null;
  datasetSizeAfter: number | null;
  file?: string;
}

export function MonoSentenceCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const stats = useMemo(() => cleanMonoSentences(cleanedText || input), [cleanedText, input]);
  const textToUpload = cleanedText || input;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const text = await file.text();
    setInput(text);
    setCleanedText("");
    setResult(null);
  };

  const handleClean = () => {
    const cleaned = cleanMonoSentences(input || cleanedText);
    if (cleaned.lines.length === 0) {
      setError("لا توجد جمل صالحة بعد التنظيف.");
      return;
    }

    setError(null);
    setCleanedText(cleaned.text);
    setResult(null);
  };

  const handleUpload = async () => {
    const cleaned = cleanMonoSentences(textToUpload);
    if (cleaned.lines.length === 0) {
      setError("نظف النص أو أضف جملة واحدة على الأقل قبل الرفع.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await apiClient.post<UploadResult>("/export/mono", {
        content: cleaned.text,
      });
      setResult(uploadResult);
    } catch (err: any) {
      setError(err.message || "فشل الرفع إلى Hugging Face.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setInput("");
    setCleanedText("");
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>إضافة جمل فقط</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            ملف نصي أو نص مباشر، ثم تنظيف وتعديل قبل الرفع إلى Hugging Face.
          </p>
        </div>
        <div className="text-sm font-medium text-gray-600">
          {stats.lines.length} جملة
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            اختيار ملف
          </Button>
          <Button type="button" onClick={handleClean} className="gap-2">
            <Sparkles className="h-4 w-4" />
            تنظيف
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            مسح
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            label="النص الأصلي"
            placeholder="الصق الجمل هنا، أو اختر ملف txt..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            className="min-h-[220px]"
            dir="auto"
          />
          <Textarea
            label="النسخة المنظفة القابلة للتعديل"
            placeholder="اضغط تنظيف لتظهر النسخة هنا..."
            value={cleanedText}
            onChange={(event) => {
              setCleanedText(event.target.value);
              setResult(null);
            }}
            className="min-h-[220px]"
            dir="auto"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleUpload}
            isLoading={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            رفع إلى Hugging Face
          </Button>
          <span className="text-sm text-gray-500">
            المستودع: ahmed200512/hassanie_claude-mono
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-md bg-gray-100 px-2 py-1">
            قصير: {stats.removedShort}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1">
            فصحى: {stats.removedFus7a}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1">
            مكرر: {stats.removedDuplicates}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-1">
            فارغ: {stats.removedEmpty}
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            تم رفع <strong>{result.uploaded}</strong> جملة في ملف جديد
            {result.file ? <>: <strong>{result.file}</strong></> : null}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
