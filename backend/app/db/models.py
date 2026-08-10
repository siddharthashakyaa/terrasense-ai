"""
Database models for TerraSense AI.

Tables:
    fields         - physical/geographic fields the user has registered
    soil_analyses  - every prediction run, tied to a field, stored for history/trends
    datasets       - uploaded / generated CSV datasets used for ML training
    model_runs     - metadata + metrics for each trained model version
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON, Boolean
)
from sqlalchemy.orm import relationship

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Field(Base):
    __tablename__ = "fields"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil_type = Column(String, nullable=True)
    area_hectares = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    analyses = relationship("SoilAnalysis", back_populates="field", cascade="all, delete-orphan")


class SoilAnalysis(Base):
    __tablename__ = "soil_analyses"

    id = Column(String, primary_key=True, default=_uuid)
    field_id = Column(String, ForeignKey("fields.id"), nullable=True)

    # Input parameters
    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    organic_carbon = Column(Float, nullable=False)
    moisture = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Outputs
    soil_health_score = Column(Float, nullable=False)
    soil_quality = Column(String, nullable=False)  # Excellent/Good/Moderate/Poor
    confidence = Column(Float, nullable=False)
    model_name = Column(String, nullable=False)

    nutrient_status = Column(JSON, nullable=True)       # {"nitrogen": "deficient", ...}
    deficiencies = Column(JSON, nullable=True)          # list of deficiency dicts
    crop_recommendations = Column(JSON, nullable=True)  # list of {crop, score, reasons}
    shap_explanation = Column(JSON, nullable=True)       # top contributing features

    created_at = Column(DateTime(timezone=True), default=_now)

    field = relationship("Field", back_populates="analyses")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=_uuid)
    filename = Column(String, nullable=False)
    source = Column(String, default="upload")  # "upload" | "synthetic"
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    columns = Column(JSON, nullable=True)
    storage_path = Column(String, nullable=False)
    is_synthetic = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(String, primary_key=True, default=_uuid)
    model_name = Column(String, nullable=False)         # logistic_regression / random_forest / xgboost
    is_active = Column(Boolean, default=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=True)
    training_rows = Column(Integer, nullable=True)
    artifact_path = Column(String, nullable=True)
    trained_at = Column(DateTime(timezone=True), default=_now)
