import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, glass = true, ...props }: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border shadow-sm transition-shadow hover:shadow-md",
        glass ? "glass" : "bg-card border-border",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0 flex items-center", className)} {...props} />;
}
