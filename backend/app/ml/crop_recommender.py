"""
Crop recommendation engine.

Scores a curated set of crops against the given soil/environment
parameters using ideal-range matching (each parameter contributes a
0-100 sub-score based on distance from the crop's ideal range), then
returns the top 5 crops with the individual reasons that drove the score.

This is a transparent, rule-based recommender (not a black-box model),
which pairs naturally with the SHAP explanations already produced for
the soil-quality classifier.
"""
from typing import List, Dict

# Each crop: ideal (min, max) ranges for the relevant parameters.
CROP_PROFILES = {
    "Rice": {"ph": (5.5, 7.0), "nitrogen": (80, 160), "moisture": (60, 90), "temperature": (20, 35), "rainfall": (1000, 2500)},
    "Wheat": {"ph": (6.0, 7.5), "nitrogen": (60, 120), "moisture": (30, 55), "temperature": (10, 25), "rainfall": (300, 900)},
    "Maize": {"ph": (5.8, 7.2), "nitrogen": (70, 140), "moisture": (35, 60), "temperature": (18, 32), "rainfall": (500, 1200)},
    "Sugarcane": {"ph": (6.0, 7.5), "nitrogen": (100, 180), "moisture": (55, 85), "temperature": (21, 35), "rainfall": (1100, 1800)},
    "Cotton": {"ph": (5.8, 8.0), "nitrogen": (60, 120), "moisture": (25, 50), "temperature": (21, 35), "rainfall": (500, 1100)},
    "Soybean": {"ph": (6.0, 7.0), "nitrogen": (30, 80), "moisture": (35, 60), "temperature": (20, 30), "rainfall": (500, 1200)},
    "Chickpea": {"ph": (6.0, 7.8), "nitrogen": (20, 60), "moisture": (20, 45), "temperature": (15, 28), "rainfall": (300, 700)},
    "Potato": {"ph": (5.0, 6.5), "nitrogen": (80, 150), "moisture": (45, 70), "temperature": (10, 24), "rainfall": (400, 900)},
    "Tomato": {"ph": (5.5, 7.0), "nitrogen": (60, 120), "moisture": (40, 65), "temperature": (18, 29), "rainfall": (400, 900)},
    "Barley": {"ph": (6.0, 7.8), "nitrogen": (40, 100), "moisture": (25, 50), "temperature": (10, 25), "rainfall": (300, 800)},
    "Groundnut": {"ph": (5.5, 7.0), "nitrogen": (20, 60), "moisture": (30, 55), "temperature": (22, 33), "rainfall": (500, 1200)},
    "Mustard": {"ph": (6.0, 7.5), "nitrogen": (40, 90), "moisture": (20, 45), "temperature": (10, 25), "rainfall": (250, 650)},
    "Millet": {"ph": (5.5, 7.5), "nitrogen": (30, 80), "moisture": (15, 40), "temperature": (25, 38), "rainfall": (300, 700)},
    "Banana": {"ph": (5.5, 7.0), "nitrogen": (100, 200), "moisture": (60, 90), "temperature": (22, 33), "rainfall": (1200, 2200)},
    "Grapes": {"ph": (5.8, 7.2), "nitrogen": (40, 100), "moisture": (25, 50), "temperature": (15, 30), "rainfall": (400, 900)},
}


def _param_score(value: float, ideal_range: tuple) -> float:
    lo, hi = ideal_range
    if lo <= value <= hi:
        return 100.0
    span = max(hi - lo, 1e-6)
    if value < lo:
        distance = lo - value
    else:
        distance = value - hi
    # Decay score based on how far outside the range the value falls,
    # relative to the width of the ideal range.
    penalty = min(100.0, (distance / span) * 100.0)
    return max(0.0, 100.0 - penalty)


def recommend_crops(soil: dict, top_n: int = 5) -> List[Dict]:
    results = []
    for crop, profile in CROP_PROFILES.items():
        sub_scores = {}
        reasons = []
        for param, ideal_range in profile.items():
            value = soil.get(param)
            if value is None:
                continue
            score = _param_score(value, ideal_range)
            sub_scores[param] = score
            lo, hi = ideal_range
            if score >= 90:
                reasons.append(f"{param.replace('_', ' ').title()} ({value}) is within the ideal range ({lo}-{hi}).")
            elif score < 60:
                reasons.append(f"{param.replace('_', ' ').title()} ({value}) is outside the ideal range ({lo}-{hi}).")

        overall = sum(sub_scores.values()) / len(sub_scores) if sub_scores else 0.0
        reasons_sorted = sorted(
            reasons,
            key=lambda r: (not r.endswith("range."), r),
        )[:4]
        results.append({
            "crop": crop,
            "suitability_score": round(overall, 1),
            "reasons": reasons_sorted or ["General suitability based on overall soil/environment profile."],
        })

    results.sort(key=lambda r: r["suitability_score"], reverse=True)
    return results[:top_n]
