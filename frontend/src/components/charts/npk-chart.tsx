"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export function NpkChart({ nitrogen, phosphorus, potassium }: { nitrogen: number; phosphorus: number; potassium: number }) {
  const data = [
    { name: "Nitrogen (N)", value: nitrogen, fill: "hsl(var(--primary))" },
    { name: "Phosphorus (P)", value: phosphorus, fill: "hsl(var(--accent))" },
    { name: "Potassium (K)", value: potassium, fill: "hsl(var(--warning))" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
