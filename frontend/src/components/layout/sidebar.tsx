"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FlaskConical, Map, History, TrendingUp, Cpu, Database, Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Soil Analysis", icon: FlaskConical },
  { href: "/map", label: "Field Map", icon: Map },
  { href: "/history", label: "History", icon: History },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/datasets", label: "Datasets", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-border glass">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Leaf size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">TerraSense AI</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Soil Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="rounded-lg bg-muted/60 px-3 py-3">
          <p className="text-xs font-medium">Demo Data Notice</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Some charts use clearly-labeled synthetic data for demonstration.
          </p>
        </div>
      </div>
    </aside>
  );
}
