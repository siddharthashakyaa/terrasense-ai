import type {
  SoilInput, SoilAnalysisResult, SoilAnalysisHistoryItem, FieldOut,
  ModelMetrics, TrainingResponse, DatasetOut, DatasetPreview,
  ForecastResponse, HealthResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  predict: (payload: SoilInput) =>
    request<SoilAnalysisResult>("/predict", { method: "POST", body: JSON.stringify(payload) }),

  history: (params?: { field_id?: string; soil_quality?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.field_id) qs.set("field_id", params.field_id);
    if (params?.soil_quality) qs.set("soil_quality", params.soil_quality);
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<SoilAnalysisHistoryItem[]>(`/history${suffix}`);
  },

  fields: () => request<FieldOut[]>("/fields"),
  createField: (payload: { name: string; latitude: number; longitude: number; soil_type?: string; area_hectares?: number }) =>
    request<FieldOut>("/fields", { method: "POST", body: JSON.stringify(payload) }),

  models: () => request<ModelMetrics[]>("/models"),
  trainModels: (dataset_id?: string) =>
    request<TrainingResponse>(`/models/train${dataset_id ? `?dataset_id=${dataset_id}` : ""}`, { method: "POST" }),

  datasets: () => request<DatasetOut[]>("/datasets"),
  uploadDataset: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<DatasetPreview>("/datasets/upload", { method: "POST", body: form });
  },
  generateSyntheticDataset: (n_records = 6000) =>
    request<DatasetOut>(`/datasets/synthetic?n_records=${n_records}`, { method: "POST" }),

  forecast: (fieldId: string) => request<ForecastResponse>(`/forecast/${fieldId}`),
};

export { ApiError, API_BASE_URL };
