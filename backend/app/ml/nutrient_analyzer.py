"""
Rule-based nutrient deficiency / imbalance detection.

These thresholds follow commonly cited general agronomic ranges for
topsoil (kg/ha for N/P/K, % for organic carbon). They are DEFAULT,
GENERAL-PURPOSE thresholds meant for demonstration -- actual optimal
ranges vary by crop, region and soil type, hence the disclaimer surfaced
to the user in the API response.
"""
from typing import List, Dict

DISCLAIMER = (
    "These nutrient thresholds and amendment suggestions are general guidelines "
    "for demonstration purposes. Always validate recommendations with a certified "
    "local agricultural extension service or soil-testing laboratory before "
    "applying any fertilizer or soil amendment."
)

# (low, high) "adequate" bands
THRESHOLDS = {
    "nitrogen": {"deficient": 40, "low": 70, "high": 140, "excessive": 180},
    "phosphorus": {"deficient": 15, "low": 30, "high": 70, "excessive": 100},
    "potassium": {"deficient": 30, "low": 50, "high": 110, "excessive": 150},
    "ph": {"deficient": 5.0, "low": 5.8, "high": 7.3, "excessive": 8.2},  # "deficient"=too acidic
    "moisture": {"deficient": 15, "low": 25, "high": 65, "excessive": 85},
}

AMENDMENTS = {
    "nitrogen": {
        "deficient": "Apply nitrogen-rich fertilizer (e.g. urea, ammonium sulfate) or incorporate legume cover crops / compost.",
        "low": "Consider a moderate nitrogen top-dressing and organic matter addition.",
        "excessive": "Reduce nitrogen fertilizer application; excess N can cause lodging and leaching into groundwater.",
    },
    "phosphorus": {
        "deficient": "Apply phosphate fertilizer (e.g. superphosphate, rock phosphate) and consider mycorrhizal inoculants.",
        "low": "Add a moderate phosphorus supplement, especially before planting.",
        "excessive": "Avoid further phosphorus application; excess P can bind soil micronutrients and cause runoff pollution.",
    },
    "potassium": {
        "deficient": "Apply potash-based fertilizer (e.g. muriate of potash, sulfate of potash) or wood ash in small quantities.",
        "low": "Consider a light potassium supplement to support root and fruit development.",
        "excessive": "Reduce potassium inputs; excess K can interfere with magnesium/calcium uptake.",
    },
    "ph": {
        "deficient": "Soil is too acidic - apply agricultural lime (calcium carbonate) to raise pH gradually.",
        "low": "Slightly acidic - a small lime application may help depending on the target crop.",
        "excessive": "Soil is too alkaline - apply elemental sulfur or acidifying organic matter to lower pH.",
    },
    "moisture": {
        "deficient": "Soil moisture is very low - increase irrigation frequency and consider mulching to retain water.",
        "low": "Soil is on the dry side - monitor irrigation scheduling closely.",
        "excessive": "Soil is waterlogged - improve drainage and avoid over-irrigation to prevent root rot.",
    },
}


def _classify(value: float, bands: Dict[str, float], nutrient: str) -> Dict[str, str]:
    """Return status + severity for a single parameter."""
    if nutrient == "ph":
        if value < bands["deficient"]:
            return {"status": "deficient", "severity": "severe", "label": "too acidic"}
        if value < bands["low"]:
            return {"status": "low", "severity": "mild", "label": "slightly acidic"}
        if value <= bands["high"]:
            return {"status": "adequate", "severity": "none", "label": "balanced"}
        if value <= bands["excessive"]:
            return {"status": "low", "severity": "mild", "label": "slightly alkaline"}
        return {"status": "excessive", "severity": "severe", "label": "too alkaline"}

    if value < bands["deficient"]:
        return {"status": "deficient", "severity": "severe", "label": "deficient"}
    if value < bands["low"]:
        return {"status": "low", "severity": "mild", "label": "low"}
    if value <= bands["high"]:
        return {"status": "adequate", "severity": "none", "label": "adequate"}
    if value <= bands["excessive"]:
        return {"status": "low", "severity": "mild", "label": "high"}
    return {"status": "excessive", "severity": "moderate", "label": "excessive"}


def analyze_nutrients(soil: dict) -> Dict[str, object]:
    """
    Returns:
        {
          "nutrient_status": {"nitrogen": "adequate", ...},
          "deficiencies": [ {nutrient, status, severity, message, suggested_amendment}, ... ]
        }
    Only parameters that are NOT "adequate" are included in `deficiencies`.
    """
    nutrient_status: Dict[str, str] = {}
    deficiencies = []

    for nutrient in ["nitrogen", "phosphorus", "potassium", "ph", "moisture"]:
        value = soil[nutrient]
        result = _classify(value, THRESHOLDS[nutrient], nutrient)
        nutrient_status[nutrient] = result["label"]

        if result["status"] != "adequate":
            amendment = AMENDMENTS[nutrient].get(result["status"], AMENDMENTS[nutrient].get("low"))
            deficiencies.append({
                "nutrient": nutrient,
                "status": result["status"],
                "severity": result["severity"],
                "message": f"{nutrient.replace('_', ' ').title()} is {result['label']} ({value}).",
                "suggested_amendment": amendment,
            })

    return {"nutrient_status": nutrient_status, "deficiencies": deficiencies}
