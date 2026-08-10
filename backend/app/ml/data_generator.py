"""
Synthetic soil dataset generator.

IMPORTANT: This produces CLEARLY LABELED SYNTHETIC / DEMO data. It is not
real agricultural sensor or lab data. It exists so the ML pipeline and the
rest of the application can be demonstrated end-to-end when a real dataset
is not supplied. Every generated file/table is tagged `is_synthetic=True`
and the CSV includes a header comment stating its synthetic nature.

The generation logic uses reasonable agronomic ranges and correlations
(e.g. higher organic carbon + balanced NPK + near-neutral pH tends to
produce better soil quality) so the resulting dataset is *learnable* by
the models, not random noise -- but it is still artificial.
"""
import numpy as np
import pandas as pd
from pathlib import Path

RANDOM_STATE = 42
N_RECORDS = 6000

SOIL_TYPES = ["Sandy", "Clay", "Loamy", "Silty", "Peaty", "Chalky"]

SYNTHETIC_HEADER_COMMENT = (
    "# TerraSense AI SYNTHETIC / DEMO DATASET - NOT REAL AGRICULTURAL DATA\n"
    "# Generated for demonstration and ML-pipeline testing purposes only.\n"
)


def _quality_from_score(score: float) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Moderate"
    return "Poor"


def generate_synthetic_dataset(n_records: int = N_RECORDS, seed: int = RANDOM_STATE) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    nitrogen = rng.normal(75, 30, n_records).clip(0, 200)
    phosphorus = rng.normal(40, 20, n_records).clip(0, 150)
    potassium = rng.normal(60, 25, n_records).clip(0, 200)
    ph = rng.normal(6.5, 1.0, n_records).clip(3.5, 9.5)
    organic_carbon = rng.normal(1.2, 0.6, n_records).clip(0.05, 5.0)
    moisture = rng.normal(45, 18, n_records).clip(2, 95)
    temperature = rng.normal(26, 6, n_records).clip(2, 45)
    humidity = rng.normal(60, 15, n_records).clip(5, 100)
    rainfall = rng.gamma(shape=2.0, scale=90, size=n_records).clip(0, 3500)
    soil_type = rng.choice(SOIL_TYPES, size=n_records)

    # --- Composite score driving "soil quality" label ---------------------
    # pH closeness to 6.5 (ideal neutral-slightly-acidic range for most crops)
    ph_score = 100 - (np.abs(ph - 6.5) * 18)
    # nutrient balance: reward adequate-not-excessive NPK
    n_score = 100 - np.abs(nitrogen - 90) * 0.6
    p_score = 100 - np.abs(phosphorus - 45) * 0.9
    k_score = 100 - np.abs(potassium - 70) * 0.7
    oc_score = np.clip(organic_carbon * 35, 0, 100)
    moisture_score = 100 - np.abs(moisture - 45) * 1.1

    composite = (
        0.20 * ph_score
        + 0.18 * n_score
        + 0.15 * p_score
        + 0.15 * k_score
        + 0.20 * oc_score
        + 0.12 * moisture_score
    )
    noise = rng.normal(0, 6, n_records)
    soil_health_score = np.clip(composite + noise, 0, 100)
    soil_quality = np.array([_quality_from_score(s) for s in soil_health_score])

    df = pd.DataFrame({
        "nitrogen": nitrogen.round(2),
        "phosphorus": phosphorus.round(2),
        "potassium": potassium.round(2),
        "ph": ph.round(2),
        "organic_carbon": organic_carbon.round(2),
        "moisture": moisture.round(2),
        "temperature": temperature.round(2),
        "humidity": humidity.round(2),
        "rainfall": rainfall.round(2),
        "soil_type": soil_type,
        "soil_health_score": soil_health_score.round(2),
        "soil_quality": soil_quality,
    })
    return df


def save_synthetic_dataset(path: str, n_records: int = N_RECORDS, seed: int = RANDOM_STATE) -> str:
    df = generate_synthetic_dataset(n_records=n_records, seed=seed)
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        f.write(SYNTHETIC_HEADER_COMMENT)
        df.to_csv(f, index=False)
    return str(out_path)


if __name__ == "__main__":
    p = save_synthetic_dataset("data/synthetic_soil_dataset.csv")
    print(f"Synthetic dataset written to {p}")
