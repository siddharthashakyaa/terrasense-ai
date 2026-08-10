"use client";

import * as React from "react";
import Link from "next/link";
import { Droplets, Thermometer, Wind, CloudRain, Gauge, FlaskConical, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { HealthScoreGauge } from "@/components/dashboard/health-gauge";
import { NpkChart } from "@/components/charts/npk-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { qualityColor } from "@/lib/utils";
import type { SoilAnalysisHistoryItem, ForecastResponse } from "@/types";

export default function DashboardPage() {
  const [latest, setLatest] = React.useState<SoilAnalysisHistoryItem | null>(null);
  const [forecast, setForecast] = React.useState<ForecastResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [history, fc] = await Promise.all([
          api.history({ limit: 1 }),
          api.forecast("demo"),
        ]);
        setLatest(history[0] ?? null);
        setForecast(fc);
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium">{error}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Make sure the FastAPI backend is running and a model has been trained.
        </p>
      </Card>
    );
  }

  const trendData = forecast
    ? [...forecast.history, ...forecast.forecast].map((p) => ({
        date: p.date, soil_health_score: p.soil_health_score, is_forecast: p.is_forecast,
      }))
    : [];

  return (
    <div className="space-y-6">
      {!latest && (
        <Card className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-medium">No soil analyses yet</p>
            <p className="text-sm text-muted-foreground mt-1">Run your first soil analysis to populate this dashboard with real predictions.</p>
          </div>
          <Link href="/analyze">
            <Button>Analyze Soil <ArrowRight size={16} /></Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="pH Level" value={latest?.ph.toFixed(1) ?? "—"} icon={FlaskConical} accent="accent" />
        <StatCard label="Moisture" value={latest?.moisture.toFixed(0) ?? "—"} unit="%" icon={Droplets} accent="primary" />
        <StatCard label="Temperature" value={latest?.temperature.toFixed(1) ?? "—"} unit="°C" icon={Thermometer} accent="warning" />
        <StatCard label="Humidity" value={latest?.humidity.toFixed(0) ?? "—"} unit="%" icon={Wind} accent="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Soil Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <>
                <HealthScoreGauge score={latest.soil_health_score} quality={latest.soil_quality} />
                <div className="mt-3 flex justify-center">
                  <span className={`text-xs px-3 py-1 rounded-full border ${qualityColor(latest.soil_quality)}`}>
                    Model: {latest.model_name}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>N-P-K Levels (kg/ha)</CardTitle></CardHeader>
          <CardContent>
            {latest ? (
              <NpkChart nitrogen={latest.nitrogen} phosphorus={latest.phosphorus} potassium={latest.potassium} />
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rainfall & Environment</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-1">
            <EnvRow icon={CloudRain} label="Rainfall" value={latest ? `${latest.rainfall.toFixed(0)} mm` : "—"} />
            <EnvRow icon={Gauge} label="Organic Carbon" value={latest ? `${latest.organic_carbon.toFixed(2)} %` : "—"} />
            <EnvRow icon={Thermometer} label="Confidence" value={latest ? `Real ML prediction` : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soil Health Trend {forecast?.is_synthetic && (
            <span className="ml-2 text-[10px] uppercase tracking-wide bg-warning/15 text-warning px-2 py-0.5 rounded-full border border-warning/30">
              Demo / Synthetic
            </span>
          )}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trendData} />
        </CardContent>
      </Card>
    </div>
  );
}

function EnvRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={15} /> {label}
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
