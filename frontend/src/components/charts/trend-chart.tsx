"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export interface TrendPoint {
  date: string;
  soil_health_score: number;
  is_forecast: boolean;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const firstForecastDate = data.find((d) => d.is_forecast)?.date;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: -10, right: 20, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" minTickGap={30} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {firstForecastDate && (
          <ReferenceLine x={firstForecastDate} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Forecast →", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        )}
        <Line
          type="monotone"
          dataKey="soil_health_score"
          name="Soil Health Score"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
