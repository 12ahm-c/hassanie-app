import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "PENDING" | "TRANSLATED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status === "TRANSLATED" ? "success" : "warning"}>
      {status}
    </Badge>
  );
}
