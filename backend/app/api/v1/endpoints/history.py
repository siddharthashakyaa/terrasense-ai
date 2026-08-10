from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models as db_models
from app.schemas.schemas import SoilAnalysisHistoryItem

router = APIRouter()


@router.get("/history", response_model=List[SoilAnalysisHistoryItem])
def get_history(
    db: Session = Depends(get_db),
    field_id: Optional[str] = Query(None),
    soil_quality: Optional[str] = Query(None, description="Filter: Excellent/Good/Moderate/Poor"),
    search: Optional[str] = Query(None, description="Free text search over field_id/model_name"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    q = db.query(db_models.SoilAnalysis)

    if field_id:
        q = q.filter(db_models.SoilAnalysis.field_id == field_id)
    if soil_quality:
        q = q.filter(db_models.SoilAnalysis.soil_quality == soil_quality)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (db_models.SoilAnalysis.field_id.ilike(like)) |
            (db_models.SoilAnalysis.model_name.ilike(like))
        )

    q = q.order_by(db_models.SoilAnalysis.created_at.desc()).offset(offset).limit(limit)
    return q.all()
