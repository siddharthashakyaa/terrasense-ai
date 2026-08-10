"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { qualityColor, formatDate } from "@/lib/utils";
import type { SoilAnalysisHistoryItem } from "@/types";

const QUALITY_OPTIONS = ["All", "Excellent", "Good", "Moderate", "Poor"];

export default function HistoryPage() {
  const [items, setItems] = React.useState<SoilAnalysisHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [quality, setQuality] = React.useState("All");

  const load = React.useCallback(() => {
    setLoading(true);
    api.history({
      search: search || undefined,
      soil_quality: quality === "All" ? undefined : quality,
      limit: 200,
    }).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [search, quality]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle>Analysis History ({items.length})</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search field / model..."
              className="pl-8 h-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background/50 px-3 text-sm"
          >
            {QUALITY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No analyses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Quality</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">N</th>
                  <th className="py-2 pr-4">P</th>
                  <th className="py-2 pr-4">K</th>
                  <th className="py-2 pr-4">pH</th>
                  <th className="py-2 pr-4">Moisture</th>
                  <th className="py-2 pr-4">Model</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-muted-foreground">{formatDate(it.created_at)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityColor(it.soil_quality)}`}>{it.soil_quality}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{it.soil_health_score.toFixed(0)}</td>
                    <td className="py-2.5 pr-4">{it.nitrogen.toFixed(0)}</td>
                    <td className="py-2.5 pr-4">{it.phosphorus.toFixed(0)}</td>
                    <td className="py-2.5 pr-4">{it.potassium.toFixed(0)}</td>
                    <td className="py-2.5 pr-4">{it.ph.toFixed(1)}</td>
                    <td className="py-2.5 pr-4">{it.moisture.toFixed(0)}%</td>
                    <td className="py-2.5 pr-4 text-xs capitalize">{it.model_name.replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
