from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.ml.predict_service import prediction_service
from app.schemas.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        model_loaded=prediction_service.is_loaded,
        database_connected=db_ok,
    )
