"use client";

import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href="/sentences/add">
        <Button>Add Sentences</Button>
      </a>
      <a href="/sentences?status=PENDING">
        <Button variant="outline">Go to Pending</Button>
      </a>
      <a href="/export">
        <Button variant="outline">Export to HF</Button>
      </a>
    </div>
  );
}
