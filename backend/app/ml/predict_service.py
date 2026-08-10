"""
Prediction service.

Loads the persisted model + scaler + label encoder + SHAP explainer
(produced by app/ml/train.py) once at startup, and exposes `predict_one`
which runs REAL model inference (no hardcoded outputs) and a REAL SHAP
explanation for a single soil sample.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np

from app.core.config import settings
from app.ml.train import FEATURE_COLUMNS

QUALITY_SCORE_MIDPOINT = {
    "Excellent": 90.0,
    "Good": 70.0,
    "Moderate": 50.0,
    "Poor": 25.0,
}


class ModelNotTrainedError(RuntimeError):
    pass


class PredictionService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoder = None
        self.explainer = None
        self.model_name: Optional[str] = None
        self.metrics: Optional[dict] = None
        self._loaded = False

    def load(self) -> bool:
        model_dir = Path(settings.MODEL_DIR)
        try:
            self.model = joblib.load(model_dir / settings.ACTIVE_MODEL_NAME)
            self.scaler = joblib.load(model_dir / settings.ACTIVE_SCALER_NAME)
            self.encoder = joblib.load(model_dir / settings.ACTIVE_ENCODER_NAME)
            self.explainer = joblib.load(model_dir / settings.SHAP_EXPLAINER_NAME)
            self.model_name = joblib.load(model_dir / "active_model_name.joblib")
            metrics_path = model_dir / settings.METRICS_FILE_NAME
            if metrics_path.exists():
                with open(metrics_path) as f:
                    self.metrics = json.load(f)
            self._loaded = True
        except FileNotFoundError:
            self._loaded = False
        return self._loaded

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def _ensure_loaded(self):
        if not self._loaded:
            if not self.load():
                raise ModelNotTrainedError(
                    "No trained model found. Run the training pipeline first "
                    "(POST /api/v1/models/train or `python -m app.ml.train`)."
                )

    def _soil_health_score(self, quality_label: str, class_probs: Dict[str, float]) -> float:
        """
        Blend the class midpoint score with confidence to produce a continuous
        0-100 health score rather than a flat bucket value, e.g. a 95%-confident
        "Good" prediction scores higher than a 55%-confident one.
        """
        base = QUALITY_SCORE_MIDPOINT.get(quality_label, 50.0)
        confidence = class_probs.get(quality_label, 0.5)
        # widen/narrow around the bucket midpoint by up to +/-9 points based on confidence
        adjustment = (confidence - 0.5) * 18
        score = base + adjustment
        return float(np.clip(score, 0, 100))

    def predict_one(self, soil: dict) -> Dict:
        self._ensure_loaded()

        x = np.array([[soil[c] for c in FEATURE_COLUMNS]])
        x_scaled = self.scaler.transform(x)

        pred_idx = self.model.predict(x_scaled)[0]
        quality_label = self.encoder.inverse_transform([pred_idx])[0]

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(x_scaled)[0]
            class_probs = {
                cls: float(p) for cls, p in zip(self.encoder.classes_, proba)
            }
        else:
            class_probs = {quality_label: 1.0}

        confidence = class_probs.get(quality_label, 1.0)
        health_score = self._soil_health_score(quality_label, class_probs)

        shap_contributions = self._explain(x_scaled, pred_idx)

        return {
            "soil_quality": str(quality_label),
            "confidence": round(confidence, 4),
            "soil_health_score": round(health_score, 1),
            "class_probabilities": {k: round(v, 4) for k, v in class_probs.items()},
            "model_name": self.model_name,
            "shap_explanation": shap_contributions,
        }

    def _explain(self, x_scaled: np.ndarray, pred_idx: int) -> List[Dict]:
        """
        Compute SHAP values for the predicted sample and return the top
        contributing features sorted by absolute impact.
        """
        try:
            shap_values = self.explainer(x_scaled)
            values = shap_values.values
            # Multi-class output shapes vary by explainer/model:
            # (1, n_features, n_classes) or (1, n_features)
            if values.ndim == 3:
                contrib = values[0, :, pred_idx]
            else:
                contrib = values[0]
        except Exception:
            # Fallback: zero contributions if SHAP computation fails for any reason
            contrib = np.zeros(len(FEATURE_COLUMNS))

        raw_values = x_scaled[0]
        items = []
        for feat, shap_val, raw_val in zip(FEATURE_COLUMNS, contrib, raw_values):
            items.append({
                "feature": feat,
                "value": round(float(raw_val), 3),
                "shap_value": round(float(shap_val), 4),
                "impact": "positive" if shap_val >= 0 else "negative",
            })
        items.sort(key=lambda i: abs(i["shap_value"]), reverse=True)
        return items[:7]


prediction_service = PredictionService()
