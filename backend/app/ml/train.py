"""
TerraSense AI - Model training pipeline.

Trains Logistic Regression, Random Forest and XGBoost classifiers on soil
parameters to predict `soil_quality` (Excellent/Good/Moderate/Poor),
evaluates each on a held-out test split (accuracy/precision/recall/F1),
picks the best performer by F1 (macro), and persists:

    - the trained best model               (joblib)
    - the fitted StandardScaler            (joblib)
    - the fitted LabelEncoder              (joblib)
    - a SHAP TreeExplainer/Explainer       (joblib) -- for the best model
    - model_metrics.json                   (all models' metrics, for /api/v1/models)

No predictions are hardcoded anywhere in this pipeline: every score/label
comes from the trained scikit-learn / xgboost estimators.
"""
import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from xgboost import XGBClassifier

from app.core.config import settings

FEATURE_COLUMNS = [
    "nitrogen", "phosphorus", "potassium", "ph", "organic_carbon",
    "moisture", "temperature", "humidity", "rainfall",
]
TARGET_COLUMN = "soil_quality"


def _model_dir() -> Path:
    p = Path(settings.MODEL_DIR)
    p.mkdir(parents=True, exist_ok=True)
    return p


def load_dataset(csv_path: str) -> pd.DataFrame:
    """Load a CSV dataset, tolerating a leading `#` comment header (synthetic marker)."""
    df = pd.read_csv(csv_path, comment="#")
    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])
    return df


def _build_models(random_state: int) -> Dict[str, Any]:
    return {
        "logistic_regression": LogisticRegression(
            max_iter=1000, random_state=random_state
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=12, random_state=random_state, n_jobs=-1
        ),
        "xgboost": XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.08,
            subsample=0.9, colsample_bytree=0.9,
            random_state=random_state, eval_metric="mlogloss",
            tree_method="hist",
        ),
    }


def _evaluate(y_true, y_pred) -> Dict[str, float]:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def train_all_models(csv_path: str, random_state: int = None) -> Dict[str, Any]:
    """
    Full pipeline: load -> preprocess -> split -> train 3 models -> evaluate ->
    pick best by macro F1 -> persist artifacts. Returns a summary dict.
    """
    random_state = random_state if random_state is not None else settings.RANDOM_STATE
    df = load_dataset(csv_path)

    X = df[FEATURE_COLUMNS].values
    y_raw = df[TARGET_COLUMN].astype(str).values

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = _build_models(random_state)
    results = {}
    fitted = {}

    for name, model in models.items():
        t0 = time.time()
        if name == "logistic_regression":
            model.fit(X_train_scaled, y_train)
            preds = model.predict(X_test_scaled)
        else:
            # tree-based models don't require scaling, but we feed scaled data
            # consistently so the serving pipeline is uniform for all models.
            model.fit(X_train_scaled, y_train)
            preds = model.predict(X_test_scaled)
        elapsed = time.time() - t0
        metrics = _evaluate(y_test, preds)
        metrics["train_seconds"] = round(elapsed, 3)
        results[name] = metrics
        fitted[name] = model

    best_name = max(results, key=lambda k: results[k]["f1_score"])
    best_model = fitted[best_name]

    model_dir = _model_dir()
    joblib.dump(best_model, model_dir / settings.ACTIVE_MODEL_NAME)
    joblib.dump(scaler, model_dir / settings.ACTIVE_SCALER_NAME)
    joblib.dump(encoder, model_dir / settings.ACTIVE_ENCODER_NAME)
    joblib.dump(best_name, model_dir / "active_model_name.joblib")

    # --- SHAP explainer -----------------------------------------------
    # TreeExplainer for tree models (fast, exact); fall back to a generic
    # Explainer (KernelExplainer under the hood) for logistic regression.
    background = X_train_scaled[
        np.random.default_rng(random_state).choice(X_train_scaled.shape[0], size=min(200, len(X_train_scaled)), replace=False)
    ]
    if best_name in ("random_forest", "xgboost"):
        explainer = shap.TreeExplainer(best_model)
    else:
        explainer = shap.Explainer(best_model, background, feature_names=FEATURE_COLUMNS)
    joblib.dump(explainer, model_dir / settings.SHAP_EXPLAINER_NAME)

    metrics_payload = {
        "best_model": best_name,
        "trained_at": pd.Timestamp.utcnow().isoformat(),
        "dataset_rows": int(len(df)),
        "feature_columns": FEATURE_COLUMNS,
        "class_labels": list(encoder.classes_),
        "models": results,
    }
    with open(model_dir / settings.METRICS_FILE_NAME, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    return metrics_payload


if __name__ == "__main__":
    from app.ml.data_generator import save_synthetic_dataset

    csv_path = settings.SYNTHETIC_DATASET_PATH
    if not Path(csv_path).exists():
        print("No dataset found - generating synthetic dataset...")
        save_synthetic_dataset(csv_path)

    summary = train_all_models(csv_path)
    print(json.dumps(summary, indent=2))
    print(f"\nBest model: {summary['best_model']}")
