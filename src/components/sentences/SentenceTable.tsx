"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { SentenceDTO } from "@/types";

interface SentenceTableProps {
  sentences: SentenceDTO[];
  onEdit: (sentence: SentenceDTO) => void;
  onDelete: (id: number) => void;
}

export function SentenceTable({
  sentences,
  onEdit,
  onDelete,
}: SentenceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">#</TableHead>
          <TableHead>Arabic</TableHead>
          <TableHead>Hassaniya</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead className="w-24">Exported</TableHead>
          <TableHead className="w-32">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sentences.map((sentence) => (
          <TableRow key={sentence.id}>
            <TableCell className="font-mono text-gray-500">{sentence.id}</TableCell>
            <TableCell className="max-w-xs truncate" title={sentence.arabic}>
              {sentence.arabic}
            </TableCell>
            <TableCell className="max-w-xs truncate" title={sentence.hassaniya || ""}>
              {sentence.hassaniya || <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell>
              <StatusBadge status={sentence.status} />
            </TableCell>
            <TableCell className="text-center">
              {sentence.exportedAt ? (
                <span className="text-green-600">&#10003;</span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(sentence)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this sentence?")) {
                      onDelete(sentence.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
