"use client";

import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FieldOut } from "@/types";

function qualityToColor(quality?: string | null): string {
  switch (quality) {
    case "Excellent": return "#22c55e";
    case "Good": return "#16a34a";
    case "Moderate": return "#f59e0b";
    case "Poor": return "#ef4444";
    default: return "#64748b";
  }
}

function FitBounds({ fields }: { fields: FieldOut[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (fields.length === 0) return;
    if (fields.length === 1) {
      map.setView([fields[0].latitude, fields[0].longitude], 11);
      return;
    }
    const bounds = fields.map((f) => [f.latitude, f.longitude]) as [number, number][];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [fields, map]);
  return null;
}

export default function FieldMap({ fields }: { fields: FieldOut[] }) {
  const center: [number, number] =
    fields.length > 0 ? [fields[0].latitude, fields[0].longitude] : [20.5937, 78.9629];

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds fields={fields} />
      {fields.map((f) => (
        <CircleMarker
          key={f.id}
          center={[f.latitude, f.longitude]}
          radius={11}
          pathOptions={{
            color: qualityToColor(f.latest_quality),
            fillColor: qualityToColor(f.latest_quality),
            fillOpacity: 0.55,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{f.name}</p>
              {f.soil_type && <p className="text-xs text-gray-500">{f.soil_type} soil</p>}
              {f.latest_quality ? (
                <p className="mt-1">
                  Health score: <strong>{f.latest_health_score?.toFixed(0)}</strong> — {f.latest_quality}
                </p>
              ) : (
                <p className="mt-1 text-gray-500">No analysis yet</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
