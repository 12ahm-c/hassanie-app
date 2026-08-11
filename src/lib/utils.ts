import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatISODate(date: Date | string | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}
