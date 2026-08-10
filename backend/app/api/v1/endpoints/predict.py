from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models as db_models
from app.ml.predict_service import prediction_service, ModelNotTrainedError
from app.ml.nutrient_analyzer import analyze_nutrients, DISCLAIMER
from app.ml.crop_recommender import recommend_crops
from app.schemas.schemas import SoilInput, SoilAnalysisResult

router = APIRouter()


@router.post("/predict", response_model=SoilAnalysisResult)
def predict_soil_quality(payload: SoilInput, db: Session = Depends(get_db)):
    soil_dict = {
        "nitrogen": payload.nitrogen,
        "phosphorus": payload.phosphorus,
        "potassium": payload.potassium,
        "ph": payload.ph,
        "organic_carbon": payload.organic_carbon,
        "moisture": payload.moisture,
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "rainfall": payload.rainfall,
    }

    try:
        prediction = prediction_service.predict_one(soil_dict)
    except ModelNotTrainedError as e:
        raise HTTPException(status_code=503, detail=str(e))

    nutrient_result = analyze_nutrients(soil_dict)
    crops = recommend_crops({**soil_dict, "temperature": payload.temperature, "rainfall": payload.rainfall})

    # Resolve / auto-create field
    field_id = payload.field_id
    if not field_id and payload.field_name:
        field = db_models.Field(
            name=payload.field_name,
            latitude=payload.latitude or 0.0,
            longitude=payload.longitude or 0.0,
        )
        db.add(field)
        db.flush()
        field_id = field.id

    analysis = db_models.SoilAnalysis(
        field_id=field_id,
        nitrogen=payload.nitrogen,
        phosphorus=payload.phosphorus,
        potassium=payload.potassium,
        ph=payload.ph,
        organic_carbon=payload.organic_carbon,
        moisture=payload.moisture,
        temperature=payload.temperature,
        humidity=payload.humidity,
        rainfall=payload.rainfall,
        latitude=payload.latitude,
        longitude=payload.longitude,
        soil_health_score=prediction["soil_health_score"],
        soil_quality=prediction["soil_quality"],
        confidence=prediction["confidence"],
        model_name=prediction["model_name"],
        nutrient_status=nutrient_result["nutrient_status"],
        deficiencies=nutrient_result["deficiencies"],
        crop_recommendations=crops,
        shap_explanation=prediction["shap_explanation"],
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return SoilAnalysisResult(
        id=analysis.id,
        field_id=analysis.field_id,
        soil_health_score=analysis.soil_health_score,
        soil_quality=analysis.soil_quality,
        confidence=analysis.confidence,
        model_name=analysis.model_name,
        nutrient_status=nutrient_result["nutrient_status"],
        deficiencies=nutrient_result["deficiencies"],
        crop_recommendations=crops,
        shap_explanation=prediction["shap_explanation"],
        disclaimer=DISCLAIMER,
        created_at=analysis.created_at,
    )
