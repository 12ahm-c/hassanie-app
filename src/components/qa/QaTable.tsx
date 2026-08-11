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
import { Badge } from "@/components/ui/badge";
import { QaPairDTO } from "@/types";

interface QaTableProps {
  pairs: QaPairDTO[];
  onEdit: (pair: QaPairDTO) => void;
  onDelete: (id: number) => void;
}

export function QaTable({ pairs, onEdit, onDelete }: QaTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">#</TableHead>
          <TableHead>السؤال</TableHead>
          <TableHead>الجواب</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead className="w-24">Exported</TableHead>
          <TableHead className="w-32">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pairs.map((pair) => (
          <TableRow key={pair.id}>
            <TableCell className="font-mono text-gray-500">
              {pair.id}
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={pair.question}
            >
              {pair.question}
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={pair.answer}
            >
              {pair.answer || <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  pair.status === "ANSWERED" ? "success" : "warning"
                }
              >
                {pair.status}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              {pair.exportedAt ? (
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
                  onClick={() => onEdit(pair)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this Q&A pair?")) {
                      onDelete(pair.id);
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
