import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-danger";
}

export function qualityColor(quality: string): string {
  switch (quality) {
    case "Excellent": return "bg-success/15 text-success border-success/30";
    case "Good": return "bg-primary/15 text-primary border-primary/30";
    case "Moderate": return "bg-warning/15 text-warning border-warning/30";
    case "Poor": return "bg-danger/15 text-danger border-danger/30";
    default: return "bg-muted text-muted-foreground";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
