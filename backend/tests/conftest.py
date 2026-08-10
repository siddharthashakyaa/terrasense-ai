"""
Shared pytest fixtures. Uses an isolated SQLite DB (not Postgres) so the
test suite runs anywhere without external services, and ensures a trained
model exists (training a tiny one if needed) before API tests run.
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_terrasense.db")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def _ensure_model_trained():
    from app.core.config import settings
    from app.ml.data_generator import save_synthetic_dataset
    from app.ml.train import train_all_models

    model_path = Path(settings.MODEL_DIR) / settings.ACTIVE_MODEL_NAME
    if not model_path.exists():
        csv_path = settings.SYNTHETIC_DATASET_PATH
        if not Path(csv_path).exists():
            save_synthetic_dataset(csv_path, n_records=1000)
        train_all_models(csv_path)
    yield


@pytest.fixture(scope="session")
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_soil_payload():
    return {
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 60.0,
        "ph": 6.5,
        "organic_carbon": 1.2,
        "moisture": 45.0,
        "temperature": 26.0,
        "humidity": 60.0,
        "rainfall": 800.0,
    }
