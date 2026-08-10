"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { qualityColor } from "@/lib/utils";
import type { FieldOut } from "@/types";

const FieldMap = dynamic(() => import("@/components/map/field-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function MapPage() {
  const [fields, setFields] = React.useState<FieldOut[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.fields().then(setFields).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <Card className="xl:col-span-3 h-[600px] overflow-hidden">
        <CardContent className="p-2 h-full">
          {loading ? <Skeleton className="h-full w-full" /> : <FieldMap fields={fields} />}
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader><CardTitle>Registered Fields ({fields.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-[540px] overflow-y-auto">
          {fields.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              No fields yet. Fields are created automatically when you name a field during Soil Analysis, or via the API.
            </p>
          )}
          {fields.map((f) => (
            <div key={f.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{f.name}</p>
                {f.latest_quality && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityColor(f.latest_quality)}`}>
                    {f.latest_quality}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)} {f.soil_type ? `· ${f.soil_type}` : ""}
              </p>
              {f.latest_health_score != null && (
                <p className="text-xs mt-1">Score: <strong>{f.latest_health_score.toFixed(0)}</strong>/100</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
