import { MonoSentenceCard } from "@/components/sentences/MonoSentenceCard";

export default function MonoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">جمل فردي Mono</h1>
        <a href="/" className="text-sm text-blue-600 hover:text-blue-800">
          العودة للبداية
        </a>
      </div>

      <MonoSentenceCard />
    </div>
  );
}
