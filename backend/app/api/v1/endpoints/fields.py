from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models as db_models
from app.schemas.schemas import FieldCreate, FieldOut

router = APIRouter()


@router.get("/fields", response_model=List[FieldOut])
def list_fields(db: Session = Depends(get_db)):
    fields = db.query(db_models.Field).order_by(db_models.Field.created_at.desc()).all()
    results = []
    for f in fields:
        latest = (
            db.query(db_models.SoilAnalysis)
            .filter(db_models.SoilAnalysis.field_id == f.id)
            .order_by(db_models.SoilAnalysis.created_at.desc())
            .first()
        )
        results.append(FieldOut(
            id=f.id, name=f.name, latitude=f.latitude, longitude=f.longitude,
            soil_type=f.soil_type, area_hectares=f.area_hectares, created_at=f.created_at,
            latest_health_score=latest.soil_health_score if latest else None,
            latest_quality=latest.soil_quality if latest else None,
        ))
    return results


@router.post("/fields", response_model=FieldOut)
def create_field(payload: FieldCreate, db: Session = Depends(get_db)):
    field = db_models.Field(**payload.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return FieldOut(
        id=field.id, name=field.name, latitude=field.latitude, longitude=field.longitude,
        soil_type=field.soil_type, area_hectares=field.area_hectares, created_at=field.created_at,
        latest_health_score=None, latest_quality=None,
    )


@router.get("/fields/{field_id}", response_model=FieldOut)
def get_field(field_id: str, db: Session = Depends(get_db)):
    field = db.query(db_models.Field).filter(db_models.Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    latest = (
        db.query(db_models.SoilAnalysis)
        .filter(db_models.SoilAnalysis.field_id == field_id)
        .order_by(db_models.SoilAnalysis.created_at.desc())
        .first()
    )
    return FieldOut(
        id=field.id, name=field.name, latitude=field.latitude, longitude=field.longitude,
        soil_type=field.soil_type, area_hectares=field.area_hectares, created_at=field.created_at,
        latest_health_score=latest.soil_health_score if latest else None,
        latest_quality=latest.soil_quality if latest else None,
    )
