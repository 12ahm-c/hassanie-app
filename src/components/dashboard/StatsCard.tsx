import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning";
}

const variantStyles = {
  default: "bg-white border-gray-200",
  success: "bg-green-50 border-green-200",
  warning: "bg-yellow-50 border-yellow-200",
};

const valueStyles = {
  default: "text-gray-900",
  success: "text-green-600",
  warning: "text-yellow-600",
};

export function StatsCard({ label, value, icon, variant = "default" }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-6 shadow-sm",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={cn("mt-1 text-3xl font-bold", valueStyles[variant])}>
            {value.toLocaleString()}
          </p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
