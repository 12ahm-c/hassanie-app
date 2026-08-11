"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-semibold text-red-600">حدث خطأ ما</h2>
      <p className="mt-2 text-sm text-gray-500">
        {error.message || "حدث خطأ غير متوقع"}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
