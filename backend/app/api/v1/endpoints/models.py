from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db import models as db_models
from app.ml.train import train_all_models
from app.ml.predict_service import prediction_service
from app.schemas.schemas import ModelMetrics, TrainingResponse

router = APIRouter()


@router.get("/models", response_model=List[ModelMetrics])
def list_models(db: Session = Depends(get_db)):
    runs = db.query(db_models.ModelRun).order_by(db_models.ModelRun.trained_at.desc()).all()
    return [
        ModelMetrics(
            model_name=r.model_name, accuracy=r.accuracy, precision=r.precision,
            recall=r.recall, f1_score=r.f1_score, is_active=r.is_active,
            trained_at=r.trained_at, training_rows=r.training_rows,
        ) for r in runs
    ]


@router.post("/models/train", response_model=TrainingResponse)
def train_models(dataset_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Trains Logistic Regression, Random Forest, and XGBoost, evaluates each,
    and persists the best-performing model (by macro F1) for serving.
    """
    csv_path = settings.SYNTHETIC_DATASET_PATH
    if dataset_id:
        ds = db.query(db_models.Dataset).filter(db_models.Dataset.id == dataset_id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Dataset not found")
        csv_path = ds.storage_path

    if not Path(csv_path).exists():
        from app.ml.data_generator import save_synthetic_dataset
        save_synthetic_dataset(csv_path)

    try:
        summary = train_all_models(csv_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist run metadata; mark the best model active, deactivate the rest
    db.query(db_models.ModelRun).update({db_models.ModelRun.is_active: False})
    metrics_list = []
    trained_at = datetime.now(timezone.utc)
    for name, m in summary["models"].items():
        run = db_models.ModelRun(
            model_name=name,
            is_active=(name == summary["best_model"]),
            accuracy=m["accuracy"], precision=m["precision"],
            recall=m["recall"], f1_score=m["f1_score"],
            dataset_id=dataset_id, training_rows=summary["dataset_rows"],
            artifact_path=settings.MODEL_DIR if name == summary["best_model"] else None,
            trained_at=trained_at,
        )
        db.add(run)
        metrics_list.append(ModelMetrics(
            model_name=name, accuracy=m["accuracy"], precision=m["precision"],
            recall=m["recall"], f1_score=m["f1_score"],
            is_active=(name == summary["best_model"]),
            trained_at=trained_at, training_rows=summary["dataset_rows"],
        ))
    db.commit()

    prediction_service.load()  # reload freshly trained artifacts into memory

    return TrainingResponse(
        best_model=summary["best_model"],
        metrics=metrics_list,
        dataset_rows=summary["dataset_rows"],
        message=f"Training complete. Best model '{summary['best_model']}' is now active for inference.",
    )
