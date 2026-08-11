"use client";

interface ExportProgressProps {
  currentStep: number;
}

const steps = [
  "Fetching translated sentences...",
  "Downloading existing dataset...",
  "Merging and deduplicating...",
  "Uploading to Hugging Face...",
  "Updating export status...",
];

export function ExportProgress({ currentStep }: ExportProgressProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              index < currentStep
                ? "bg-green-100 text-green-700"
                : index === currentStep
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {index < currentStep ? "✓" : index + 1}
          </div>
          <span
            className={`text-sm ${
              index <= currentStep ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
