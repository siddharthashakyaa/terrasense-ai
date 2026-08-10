"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { SoilInput } from "@/types";

const DEFAULTS: SoilInput = {
  nitrogen: 80, phosphorus: 40, potassium: 60, ph: 6.5, organic_carbon: 1.2,
  moisture: 45, temperature: 26, humidity: 60, rainfall: 800,
  latitude: 28.6139, longitude: 77.209, field_name: "",
};

const FIELDS: { key: keyof SoilInput; label: string; unit: string; step?: string }[] = [
  { key: "nitrogen", label: "Nitrogen (N)", unit: "kg/ha" },
  { key: "phosphorus", label: "Phosphorus (P)", unit: "kg/ha" },
  { key: "potassium", label: "Potassium (K)", unit: "kg/ha" },
  { key: "ph", label: "Soil pH", unit: "", step: "0.1" },
  { key: "organic_carbon", label: "Organic Carbon", unit: "%", step: "0.1" },
  { key: "moisture", label: "Moisture", unit: "%" },
  { key: "temperature", label: "Temperature", unit: "°C", step: "0.1" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "rainfall", label: "Rainfall", unit: "mm" },
];

export function SoilAnalysisForm({ onSubmit, loading }: { onSubmit: (input: SoilInput) => void; loading: boolean }) {
  const [form, setForm] = React.useState<SoilInput>(DEFAULTS);

  const handleChange = (key: keyof SoilInput, value: string) => {
    setForm((f) => ({ ...f, [key]: key === "field_name" ? value : Number(value) }));
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-5"
    >
      <div>
        <Label htmlFor="field_name">Field Name (optional)</Label>
        <Input
          id="field_name"
          placeholder="e.g. North Field, Plot 4"
          value={form.field_name ?? ""}
          onChange={(e) => handleChange("field_name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {FIELDS.map(({ key, label, unit, step }) => (
          <div key={key}>
            <Label htmlFor={key}>{label} {unit && <span className="text-muted-foreground">({unit})</span>}</Label>
            <Input
              id={key}
              type="number"
              step={step ?? "1"}
              value={form[key] as number}
              onChange={(e) => handleChange(key, e.target.value)}
              required
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" type="number" step="0.0001" value={form.latitude ?? ""} onChange={(e) => handleChange("latitude", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" type="number" step="0.0001" value={form.longitude ?? ""} onChange={(e) => handleChange("longitude", e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? "Running ML Prediction..." : "Analyze Soil"}
      </Button>
    </form>
  );
}
