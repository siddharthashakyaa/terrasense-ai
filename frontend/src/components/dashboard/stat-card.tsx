import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, unit, icon: Icon, accent = "primary", sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "warning" | "danger" | "success";
  sub?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", accentClasses[accent])}>
          <Icon size={18} />
        </div>
      </CardContent>
    </Card>
  );
}
