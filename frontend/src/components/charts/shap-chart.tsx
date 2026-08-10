"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import type { ShapFeatureContribution } from "@/types";

const FEATURE_LABELS: Record<string, string> = {
  nitrogen: "Nitrogen", phosphorus: "Phosphorus", potassium: "Potassium",
  ph: "pH", organic_carbon: "Organic Carbon", moisture: "Moisture",
  temperature: "Temperature", humidity: "Humidity", rainfall: "Rainfall",
};

export function ShapChart({ data }: { data: ShapFeatureContribution[] }) {
  const chartData = [...data]
    .sort((a, b) => Math.abs(a.shap_value) - Math.abs(b.shap_value))
    .map((d) => ({
      name: FEATURE_LABELS[d.feature] || d.feature,
      value: d.shap_value,
      fill: d.impact === "positive" ? "hsl(var(--success))" : "hsl(var(--danger))",
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} stroke="hsl(var(--muted-foreground))" />
        <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
          formatter={(value: number) => [value.toFixed(4), "SHAP value"]}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={18}>
          {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
