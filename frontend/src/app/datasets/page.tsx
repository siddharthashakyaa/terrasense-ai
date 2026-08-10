"use client";

import * as React from "react";
import { Upload, Database, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { DatasetOut, DatasetPreview } from "@/types";

export default function DatasetsPage() {
  const [datasets, setDatasets] = React.useState<DatasetOut[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState<DatasetPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    api.datasets().then(setDatasets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDataset(file);
      setPreview(result);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateSynthetic = async () => {
    setGenerating(true);
    setError(null);
    try {
      await api.generateSyntheticDataset(6000);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Upload size={18} /></div>
            <div>
              <p className="font-medium text-sm">Upload a Soil Dataset</p>
              <p className="text-xs text-muted-foreground">CSV with nitrogen, phosphorus, potassium, ph, organic_carbon, moisture, temperature, humidity, rainfall, soil_quality columns.</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
          <Button variant="outline" className="w-full" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading & Validating..." : "Choose CSV File"}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><Sparkles size={18} /></div>
            <div>
              <p className="font-medium text-sm">Generate Synthetic / Demo Dataset</p>
              <p className="text-xs text-muted-foreground">
                Creates a clearly-labeled 6,000-row synthetic dataset — not real agricultural data — for demos and testing.
              </p>
            </div>
          </div>
          <Button className="w-full" disabled={generating} onClick={handleGenerateSynthetic}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            {generating ? "Generating..." : "Generate Synthetic Dataset"}
          </Button>
        </Card>
      </div>

      {error && <Card className="p-4 border-danger/30 bg-danger/10 text-sm text-danger">{error}</Card>}

      {preview && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Preview: {preview.dataset.filename}</CardTitle>
            <Badge className={preview.valid_for_training ? "bg-success/15 text-success border-success/30" : "bg-danger/15 text-danger border-danger/30"}>
              {preview.valid_for_training ? <><CheckCircle2 size={12} className="inline mr-1" />Ready for training</> : <><XCircle size={12} className="inline mr-1" />Validation issues</>}
            </Badge>
          </CardHeader>
          <CardContent>
            <ul className="mb-3 space-y-1">
              {preview.validation_messages.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {m}</li>
              ))}
            </ul>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    {preview.dataset.columns.map((c) => <th key={c} className="py-2 pr-3 whitespace-nowrap">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview_rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {preview.dataset.columns.map((c) => (
                        <td key={c} className="py-1.5 pr-3 whitespace-nowrap">{String((row as any)[c] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Datasets ({datasets.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No datasets yet.</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {d.filename}
                      {d.is_synthetic && (
                        <span className="text-[10px] uppercase tracking-wide bg-warning/15 text-warning px-2 py-0.5 rounded-full border border-warning/30">
                          Synthetic
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.row_count.toLocaleString()} rows · {d.column_count} columns · {formatDate(d.created_at)}
                    </p>
                  </div>
                  <Badge>{d.source}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
