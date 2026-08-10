"""
Pydantic schemas for request validation and response serialization.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Several schemas below use a `model_name` / `model_loaded` field (referring to
# the ML model), which collides with pydantic's own "model_" protected
# namespace. Each affected schema disables that check via protected_namespaces=().


# ---------------------------------------------------------------------------
# Soil analysis / prediction
# ---------------------------------------------------------------------------

class SoilInput(BaseModel):
    field_id: Optional[str] = None
    field_name: Optional[str] = Field(None, description="Used to auto-create a field if field_id not given")
    nitrogen: float = Field(..., ge=0, le=500, description="Nitrogen content (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=500, description="Phosphorus content (kg/ha)")
    potassium: float = Field(..., ge=0, le=500, description="Potassium content (kg/ha)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    organic_carbon: float = Field(..., ge=0, le=10, description="Organic carbon (%)")
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture (%)")
    temperature: float = Field(..., ge=-10, le=60, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    rainfall: float = Field(..., ge=0, le=5000, description="Rainfall (mm)")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class NutrientDeficiency(BaseModel):
    nutrient: str
    status: str            # "deficient" | "low" | "adequate" | "excessive"
    severity: str           # "none" | "mild" | "moderate" | "severe"
    message: str
    suggested_amendment: str


class CropRecommendation(BaseModel):
    crop: str
    suitability_score: float
    reasons: List[str]


class ShapFeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: str  # "positive" | "negative"


class SoilAnalysisResult(BaseModel):
    id: str
    field_id: Optional[str] = None
    soil_health_score: float
    soil_quality: str
    confidence: float
    model_name: str
    nutrient_status: Dict[str, str]
    deficiencies: List[NutrientDeficiency]
    crop_recommendations: List[CropRecommendation]
    shap_explanation: List[ShapFeatureContribution]
    disclaimer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class SoilAnalysisHistoryItem(BaseModel):
    id: str
    field_id: Optional[str]
    soil_health_score: float
    soil_quality: str
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    organic_carbon: float
    moisture: float
    temperature: float
    humidity: float
    rainfall: float
    model_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


# ---------------------------------------------------------------------------
# Fields
# ---------------------------------------------------------------------------

class FieldCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    soil_type: Optional[str] = None
    area_hectares: Optional[float] = None


class FieldOut(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    soil_type: Optional[str]
    area_hectares: Optional[float]
    created_at: datetime
    latest_health_score: Optional[float] = None
    latest_quality: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


# ---------------------------------------------------------------------------
# Models / training
# ---------------------------------------------------------------------------

class ModelMetrics(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    is_active: bool
    trained_at: datetime
    training_rows: Optional[int] = None


class TrainingResponse(BaseModel):
    best_model: str
    metrics: List[ModelMetrics]
    dataset_rows: int
    message: str


# ---------------------------------------------------------------------------
# Datasets
# ---------------------------------------------------------------------------

class DatasetOut(BaseModel):
    id: str
    filename: str
    source: str
    row_count: int
    column_count: int
    columns: List[str]
    is_synthetic: bool
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class DatasetPreview(BaseModel):
    dataset: DatasetOut
    preview_rows: List[Dict[str, Any]]
    valid_for_training: bool
    validation_messages: List[str]


# ---------------------------------------------------------------------------
# Forecast
# ---------------------------------------------------------------------------

class ForecastPoint(BaseModel):
    date: str
    soil_health_score: float
    nitrogen: float
    phosphorus: float
    potassium: float
    moisture: float
    is_forecast: bool


class ForecastResponse(BaseModel):
    field_id: Optional[str]
    is_synthetic: bool
    disclaimer: str
    history: List[ForecastPoint]
    forecast: List[ForecastPoint]


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    app_name: str
    version: str
    model_loaded: bool
    database_connected: bool
