export interface SoilInput {
  field_id?: string | null;
  field_name?: string | null;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organic_carbon: number;
  moisture: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NutrientDeficiency {
  nutrient: string;
  status: string;
  severity: string;
  message: string;
  suggested_amendment: string;
}

export interface CropRecommendation {
  crop: string;
  suitability_score: number;
  reasons: string[];
}

export interface ShapFeatureContribution {
  feature: string;
  value: number;
  shap_value: number;
  impact: "positive" | "negative";
}

export interface SoilAnalysisResult {
  id: string;
  field_id?: string | null;
  soil_health_score: number;
  soil_quality: "Excellent" | "Good" | "Moderate" | "Poor" | string;
  confidence: number;
  model_name: string;
  nutrient_status: Record<string, string>;
  deficiencies: NutrientDeficiency[];
  crop_recommendations: CropRecommendation[];
  shap_explanation: ShapFeatureContribution[];
  disclaimer: string;
  created_at: string;
}

export interface SoilAnalysisHistoryItem {
  id: string;
  field_id?: string | null;
  soil_health_score: number;
  soil_quality: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organic_carbon: number;
  moisture: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  model_name: string;
  created_at: string;
}

export interface FieldOut {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  soil_type?: string | null;
  area_hectares?: number | null;
  created_at: string;
  latest_health_score?: number | null;
  latest_quality?: string | null;
}

export interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  is_active: boolean;
  trained_at: string;
  training_rows?: number | null;
}

export interface TrainingResponse {
  best_model: string;
  metrics: ModelMetrics[];
  dataset_rows: number;
  message: string;
}

export interface DatasetOut {
  id: string;
  filename: string;
  source: string;
  row_count: number;
  column_count: number;
  columns: string[];
  is_synthetic: boolean;
  notes?: string | null;
  created_at: string;
}

export interface DatasetPreview {
  dataset: DatasetOut;
  preview_rows: Record<string, unknown>[];
  valid_for_training: boolean;
  validation_messages: string[];
}

export interface ForecastPoint {
  date: string;
  soil_health_score: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  is_forecast: boolean;
}

export interface ForecastResponse {
  field_id?: string | null;
  is_synthetic: boolean;
  disclaimer: string;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  model_loaded: boolean;
  database_connected: boolean;
}
