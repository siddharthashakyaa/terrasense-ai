"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { api } from "@/lib/api";
import type { ForecastResponse } from "@/types";

export default function ForecastPage() {
  const [data, setData] = React.useState<ForecastResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.forecast("demo").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  if (!data) return <Card className="p-8 text-center text-sm text-muted-foreground">Could not load forecast data.</Card>;

  const combined = [...data.history, ...data.forecast];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
        <Info size={15} className="mt-0.5 shrink-0" />
        {data.disclaimer} {data.is_synthetic && "This chart currently uses clearly-labeled synthetic/demo history since insufficient real field history is available."}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Soil Health Score — Trend & 14-Day Forecast
            {data.is_synthetic && (
              <span className="ml-2 text-[10px] uppercase tracking-wide bg-warning/15 text-warning px-2 py-0.5 rounded-full border border-warning/30">
                Synthetic Demo
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={combined.map((p) => ({ date: p.date, soil_health_score: p.soil_health_score, is_forecast: p.is_forecast }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nutrient Trends (N-P-K & Moisture)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combined} margin={{ left: -10, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={30} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="nitrogen" name="Nitrogen" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="phosphorus" name="Phosphorus" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="potassium" name="Potassium" stroke="hsl(var(--warning))" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="moisture" name="Moisture" stroke="hsl(var(--danger))" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
