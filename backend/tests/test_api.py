def test_health_endpoint(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in {"ok", "degraded"}
    assert body["model_loaded"] is True


def test_predict_endpoint_returns_real_prediction(client, sample_soil_payload):
    r = client.post("/api/v1/predict", json=sample_soil_payload)
    assert r.status_code == 200
    body = r.json()
    assert body["soil_quality"] in {"Excellent", "Good", "Moderate", "Poor"}
    assert 0 <= body["soil_health_score"] <= 100
    assert len(body["crop_recommendations"]) == 5
    assert len(body["shap_explanation"]) > 0
    assert "disclaimer" in body and len(body["disclaimer"]) > 0


def test_predict_validates_input_ranges(client, sample_soil_payload):
    bad_payload = {**sample_soil_payload, "ph": 25}  # out of 0-14 range
    r = client.post("/api/v1/predict", json=bad_payload)
    assert r.status_code == 422


def test_field_creation_and_listing(client):
    r = client.post("/api/v1/fields", json={
        "name": "Test Field", "latitude": 12.9, "longitude": 77.6, "soil_type": "Loamy"
    })
    assert r.status_code == 200
    field_id = r.json()["id"]

    r = client.get("/api/v1/fields")
    assert r.status_code == 200
    assert any(f["id"] == field_id for f in r.json())


def test_history_after_prediction(client, sample_soil_payload):
    client.post("/api/v1/predict", json=sample_soil_payload)
    r = client.get("/api/v1/history")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_history_filter_by_quality(client, sample_soil_payload):
    client.post("/api/v1/predict", json=sample_soil_payload)
    r = client.get("/api/v1/history", params={"soil_quality": "Excellent"})
    assert r.status_code == 200
    for item in r.json():
        assert item["soil_quality"] == "Excellent"


def test_forecast_endpoint_labels_synthetic_data(client):
    r = client.get("/api/v1/forecast/demo")
    assert r.status_code == 200
    body = r.json()
    assert "disclaimer" in body
    assert all(p["is_forecast"] is False for p in body["history"])
    assert all(p["is_forecast"] is True for p in body["forecast"])


def test_models_metrics_endpoint(client, sample_soil_payload):
    # trigger a training run so model_runs has data
    r = client.post("/api/v1/models/train")
    assert r.status_code == 200
    body = r.json()
    assert body["best_model"] in {"logistic_regression", "random_forest", "xgboost"}
    assert len(body["metrics"]) == 3

    r2 = client.get("/api/v1/models")
    assert r2.status_code == 200
    assert len(r2.json()) >= 3


def test_dataset_synthetic_generation_endpoint(client):
    r = client.post("/api/v1/datasets/synthetic", params={"n_records": 500})
    assert r.status_code == 200
    body = r.json()
    assert body["is_synthetic"] is True
    assert body["row_count"] == 500
