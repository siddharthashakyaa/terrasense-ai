"use client";

import * as React from "react";
import { AlertTriangle, Sprout, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SoilAnalysisForm } from "@/components/dashboard/soil-analysis-form";
import { HealthScoreGauge } from "@/components/dashboard/health-gauge";
import { ShapChart } from "@/components/charts/shap-chart";
import { api, ApiError } from "@/lib/api";
import { qualityColor } from "@/lib/utils";
import type { SoilAnalysisResult, SoilInput } from "@/types";

const SEVERITY_COLOR: Record<string, string> = {
  severe: "border-danger/40 bg-danger/10",
  moderate: "border-warning/40 bg-warning/10",
  mild: "border-warning/30 bg-warning/5",
  none: "border-border",
};

export default function AnalyzePage() {
  const [result, setResult] = React.useState<SoilAnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (input: SoilInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(input);
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        setError("No trained model found yet. Go to the Models page and click 'Train Models' first.");
      } else {
        setError((e as Error).message || "Prediction failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <Card className="xl:col-span-2 h-fit">
        <CardHeader><CardTitle>Enter Soil & Environment Parameters</CardTitle></CardHeader>
        <CardContent>
          <SoilAnalysisForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="xl:col-span-3 space-y-6">
        {!result && !loading && (
          <Card className="h-full flex items-center justify-center py-24">
            <div className="text-center text-muted-foreground">
              <Sprout size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Submit soil parameters to get a real ML-powered analysis.</p>
            </div>
          </Card>
        )}

        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Soil Health Score</CardTitle></CardHeader>
                <CardContent>
                  <HealthScoreGauge score={result.soil_health_score} quality={result.soil_quality} />
                  <div className="mt-2 flex justify-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border ${qualityColor(result.soil_quality)}`}>
                      {result.soil_quality}
                    </span>
                    <Badge>{(result.confidence * 100).toFixed(0)}% confidence</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Model Used</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg font-semibold capitalize">{result.model_name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    Selected automatically during training as the best-performing model (highest macro F1 score)
                    among Logistic Regression, Random Forest, and XGBoost.
                  </p>
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground mb-1">Prediction confidence</p>
                    <Progress value={result.confidence * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Explainable AI — Why this prediction? (SHAP)</CardTitle>
              </CardHeader>
              <CardContent>
                <ShapChart data={result.shap_explanation} />
                <p className="text-xs text-muted-foreground mt-2">
                  Green bars push the prediction toward a higher soil quality class; red bars push it toward a lower one.
                  Values are SHAP contributions computed on the standardized feature scale.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Nutrient Deficiency Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.deficiencies.length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-2"><Sprout size={16} /> No significant nutrient issues detected.</p>
                ) : (
                  result.deficiencies.map((d) => (
                    <div key={d.nutrient} className={`rounded-lg border p-3 ${SEVERITY_COLOR[d.severity] || ""}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">{d.nutrient.replace(/_/g, " ")}</p>
                        <Badge className="capitalize">{d.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{d.message}</p>
                      <p className="text-xs mt-1.5"><strong>Suggested:</strong> {d.suggested_amendment}</p>
                    </div>
                  ))
                )}
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  {result.disclaimer}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top 5 Recommended Crops</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.crop_recommendations.map((c, i) => (
                  <div key={c.crop} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">#{i + 1} {c.crop}</p>
                      <span className="text-xs font-medium text-primary">{c.suitability_score.toFixed(0)}% match</span>
                    </div>
                    <Progress value={c.suitability_score} className="mt-2" />
                    <ul className="mt-2 space-y-1">
                      {c.reasons.slice(0, 2).map((r, idx) => (
                        <li key={idx} className="text-[11px] text-muted-foreground">• {r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
