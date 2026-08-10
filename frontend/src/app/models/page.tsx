"use client";

import * as React from "react";
import { Cpu, Play, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { ModelMetrics, TrainingResponse } from "@/types";

const MODEL_LABELS: Record<string, string> = {
  logistic_regression: "Logistic Regression",
  random_forest: "Random Forest",
  xgboost: "XGBoost",
};

export default function ModelsPage() {
  const [metrics, setMetrics] = React.useState<ModelMetrics[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [training, setTraining] = React.useState(false);
  const [trainResult, setTrainResult] = React.useState<TrainingResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    api.models().then(setMetrics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    try {
      const res = await api.trainModels();
      setTrainResult(res);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Training failed. Ensure the backend and dataset are available.");
    } finally {
      setTraining(false);
    }
  };

  // Show only the most recent run per model_name for the comparison chart
  const latestByModel = React.useMemo(() => {
    const map = new Map<string, ModelMetrics>();
    for (const m of metrics) {
      const existing = map.get(m.model_name);
      if (!existing || new Date(m.trained_at) > new Date(existing.trained_at)) {
        map.set(m.model_name, m);
      }
    }
    return Array.from(map.values());
  }, [metrics]);

  const chartData = latestByModel.map((m) => ({
    name: MODEL_LABELS[m.model_name] || m.model_name,
    Accuracy: +(m.accuracy * 100).toFixed(1),
    Precision: +(m.precision * 100).toFixed(1),
    Recall: +(m.recall * 100).toFixed(1),
    F1: +(m.f1_score * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Cpu size={18} />
          </div>
          <div>
            <p className="font-medium text-sm">Train Logistic Regression, Random Forest & XGBoost</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trains all three models on the current dataset, evaluates accuracy/precision/recall/F1, and
              automatically activates the best performer for live inference.
            </p>
          </div>
        </div>
        <Button onClick={handleTrain} disabled={training}>
          {training ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {training ? "Training..." : "Train Models"}
        </Button>
      </Card>

      {error && (
        <Card className="p-4 border-danger/30 bg-danger/10 text-sm text-danger">{error}</Card>
      )}

      {trainResult && (
        <Card className="p-4 border-success/30 bg-success/10 flex items-start gap-2 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 text-success shrink-0" />
          <span>{trainResult.message} Trained on {trainResult.dataset_rows.toLocaleString()} rows.</span>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Model Comparison — Accuracy / Precision / Recall / F1</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No models trained yet. Click &ldquo;Train Models&rdquo; above.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Training Run History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40" />
          ) : metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No training runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Accuracy</th>
                    <th className="py-2 pr-4">Precision</th>
                    <th className="py-2 pr-4">Recall</th>
                    <th className="py-2 pr-4">F1</th>
                    <th className="py-2 pr-4">Rows</th>
                    <th className="py-2 pr-4">Trained At</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2.5 pr-4 capitalize">{MODEL_LABELS[m.model_name] || m.model_name}</td>
                      <td className="py-2.5 pr-4">{m.is_active && <Badge className="bg-success/15 text-success border-success/30">Active</Badge>}</td>
                      <td className="py-2.5 pr-4">{(m.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">{(m.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4">{m.training_rows?.toLocaleString() ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{formatDate(m.trained_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
