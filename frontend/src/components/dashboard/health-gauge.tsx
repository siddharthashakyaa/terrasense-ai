"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { scoreColor } from "@/lib/utils";

export function HealthScoreGauge({ score, quality }: { score: number; quality: string }) {
  const color =
    score >= 80 ? "hsl(var(--success))" :
    score >= 60 ? "hsl(var(--primary))" :
    score >= 40 ? "hsl(var(--warning))" : "hsl(var(--danger))";

  const data = [{ name: "score", value: score, fill: color }];

  return (
    <div className="relative w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score.toFixed(0)}</span>
        <span className="text-xs text-muted-foreground mt-1">out of 100</span>
        <span className="mt-2 text-sm font-medium">{quality}</span>
      </div>
    </div>
  );
}
