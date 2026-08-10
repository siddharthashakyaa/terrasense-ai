"""
Central application configuration.
Values are read from environment variables / a .env file at project root.
See .env.example for the full list of supported variables.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "TerraSense AI - Smart Soil Intelligence System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://terrasense:terrasense@localhost:5432/terrasense"
    AUTO_CREATE_TABLES: bool = True  # dev convenience; set False in production and use Alembic instead

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # --- ML ---
    MODEL_DIR: str = "app/models"
    DATA_DIR: str = "data"
    SYNTHETIC_DATASET_PATH: str = "data/synthetic_soil_dataset.csv"
    ACTIVE_MODEL_NAME: str = "soil_quality_model.joblib"
    ACTIVE_ENCODER_NAME: str = "label_encoder.joblib"
    ACTIVE_SCALER_NAME: str = "scaler.joblib"
    METRICS_FILE_NAME: str = "model_metrics.json"
    SHAP_EXPLAINER_NAME: str = "shap_explainer.joblib"
    RANDOM_STATE: int = 42

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
