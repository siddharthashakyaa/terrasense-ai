"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Soil Analysis" },
  { href: "/map", label: "Field Map" },
  { href: "/history", label: "History" },
  { href: "/forecast", label: "Forecast" },
  { href: "/models", label: "Models" },
  { href: "/datasets", label: "Datasets" },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analyze": "Soil Analysis",
  "/map": "Field Map",
  "/history": "Analysis History",
  "/forecast": "Soil Health Forecast",
  "/models": "ML Models",
  "/datasets": "Datasets",
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const title = TITLES[pathname || ""] || "TerraSense AI";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border glass px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <Leaf size={18} className="text-primary" />
          <span className="font-semibold text-sm">TerraSense AI</span>
        </div>
        <h1 className="hidden lg:block text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </Button>

      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 lg:hidden glass border-b border-border p-3 flex flex-col gap-1 animate-fade-in">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === item.href ? "bg-primary/15 text-primary" : "hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
