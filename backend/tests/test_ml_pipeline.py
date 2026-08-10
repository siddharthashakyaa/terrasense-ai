from pathlib import Path

from app.ml.data_generator import generate_synthetic_dataset
from app.ml.nutrient_analyzer import analyze_nutrients
from app.ml.crop_recommender import recommend_crops
from app.core.config import settings


def test_synthetic_dataset_shape_and_labels():
    df = generate_synthetic_dataset(n_records=500, seed=1)
    assert len(df) == 500
    required_cols = {
        "nitrogen", "phosphorus", "potassium", "ph", "organic_carbon",
        "moisture", "temperature", "humidity", "rainfall",
        "soil_type", "soil_health_score", "soil_quality",
    }
    assert required_cols.issubset(set(df.columns))
    assert set(df["soil_quality"].unique()).issubset({"Excellent", "Good", "Moderate", "Poor"})
    assert df["soil_health_score"].between(0, 100).all()


def test_model_artifacts_exist_after_training():
    model_dir = Path(settings.MODEL_DIR)
    assert (model_dir / settings.ACTIVE_MODEL_NAME).exists()
    assert (model_dir / settings.ACTIVE_SCALER_NAME).exists()
    assert (model_dir / settings.ACTIVE_ENCODER_NAME).exists()
    assert (model_dir / settings.SHAP_EXPLAINER_NAME).exists()
    assert (model_dir / settings.METRICS_FILE_NAME).exists()


def test_prediction_service_real_inference(sample_soil_payload):
    from app.ml.predict_service import prediction_service
    prediction_service.load()
    result = prediction_service.predict_one(sample_soil_payload)

    assert result["soil_quality"] in {"Excellent", "Good", "Moderate", "Poor"}
    assert 0 <= result["soil_health_score"] <= 100
    assert 0 <= result["confidence"] <= 1
    assert len(result["shap_explanation"]) > 0
    # every feature contribution has a real (non-null) numeric shap value
    for item in result["shap_explanation"]:
        assert isinstance(item["shap_value"], float)


def test_nutrient_analysis_flags_deficiency():
    poor_soil = {
        "nitrogen": 10, "phosphorus": 5, "potassium": 10, "ph": 4.5,
        "organic_carbon": 0.2, "moisture": 5, "temperature": 30,
        "humidity": 40, "rainfall": 200,
    }
    result = analyze_nutrients(poor_soil)
    deficient_nutrients = {d["nutrient"] for d in result["deficiencies"]}
    assert "nitrogen" in deficient_nutrients
    assert "phosphorus" in deficient_nutrients
    assert "ph" in deficient_nutrients


def test_nutrient_analysis_adequate_soil_has_fewer_flags():
    good_soil = {
        "nitrogen": 90, "phosphorus": 45, "potassium": 70, "ph": 6.5,
        "organic_carbon": 1.5, "moisture": 45, "temperature": 25,
        "humidity": 55, "rainfall": 700,
    }
    result = analyze_nutrients(good_soil)
    assert len(result["deficiencies"]) == 0


def test_crop_recommendation_returns_top_5(sample_soil_payload):
    recs = recommend_crops(sample_soil_payload, top_n=5)
    assert len(recs) == 5
    scores = [r["suitability_score"] for r in recs]
    assert scores == sorted(scores, reverse=True)
    for r in recs:
        assert 0 <= r["suitability_score"] <= 100
        assert len(r["reasons"]) > 0
