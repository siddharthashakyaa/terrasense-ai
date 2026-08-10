# 🌱 TerraSense AI — Smart Soil Intelligence System

A full-stack, real-ML soil intelligence platform: soil health scoring, nutrient
deficiency detection, crop recommendations, and Explainable AI (SHAP) — with a
premium Next.js dashboard, FastAPI backend, and PostgreSQL storage.

> **No hardcoded predictions.** Every soil health score, quality label, and SHAP
> explanation comes from real, trained scikit-learn / XGBoost models running
> real inference. Where no real dataset or history is available, the app uses
> a **clearly labeled synthetic/demo dataset** — it is never presented as real
> agricultural data.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + Leaflet |
| Backend | Python 3.11 + FastAPI |
| ML | Pandas, scikit-learn, XGBoost, SHAP, joblib |
| Database | PostgreSQL + SQLAlchemy |
| Deployment | Docker + docker-compose |

## 2. Project Structure

```
terrasense-ai/
├── backend/
│   ├── alembic/                     # DB migrations (alembic upgrade head)
│   │   ├── env.py
│   │   └── versions/                # initial schema migration lives here
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py                 # FastAPI entrypoint
│   │   ├── core/config.py          # Settings
│   │   ├── db/                     # SQLAlchemy models + session
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── ml/
│   │   │   ├── data_generator.py   # Synthetic/demo dataset generator
│   │   │   ├── train.py            # Trains LR / RF / XGBoost, picks best, saves SHAP explainer
│   │   │   ├── predict_service.py  # Loads model, runs real inference + SHAP
│   │   │   ├── nutrient_analyzer.py
│   │   │   └── crop_recommender.py
│   │   ├── api/v1/endpoints/       # predict, history, fields, models, datasets, forecast, health
│   │   └── models/                 # persisted .joblib artifacts (created after training)
│   ├── tests/                      # pytest suite (API + ML)
│   ├── data/                       # generated/uploaded CSV datasets
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/app/{dashboard,analyze,map,history,forecast,models,datasets}/
│   ├── src/components/{ui,layout,dashboard,charts,map}/
│   ├── src/lib/api.ts               # typed API client
│   ├── src/types/index.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 3. Features

- **Dashboard** — soil health score (0–100), quality bucket, N/P/K, pH/moisture/temp/humidity, trend chart, field map preview
- **Soil Analysis** (`/analyze`) — enter 9 soil/environment parameters → real ML prediction, SHAP explanation, deficiencies, top-5 crops
- **Explainable AI** — SHAP `TreeExplainer`/`Explainer` computed per-prediction, visualized as a feature-contribution chart
- **Crop Recommendation** — transparent, ideal-range-based scoring engine, top 5 crops with reasons
- **Nutrient Analysis** — rule-based N/P/K/pH/moisture deficiency detection with suggested amendments + disclaimer
- **Forecast** — real history (when available) + trend-projected forecast, clearly labeled when synthetic
- **Interactive Map** — Leaflet map of fields colored by latest soil-health status
- **History** — searchable/filterable table of all past analyses (stored in PostgreSQL)
- **CSV Upload** — upload your own dataset, preview it, validate required columns, use it for training
- **Models page** — trains Logistic Regression, Random Forest, XGBoost; compares accuracy/precision/recall/F1; shows the auto-selected best model

## 4. Quick Start — Docker (recommended)

```bash
# 1. Clone / unzip the project, then from the project root:
cp .env.example .env

# 2. Build and start Postgres + backend + frontend
docker compose up --build

# The backend automatically generates the synthetic dataset and trains
# the models on first boot (see docker-compose.yml `command:`).
```

- Frontend: http://localhost:3000
- Backend API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

To retrain later (e.g. after uploading a new dataset), either click **"Train
Models"** on the `/models` page, or:

```bash
docker compose exec backend python -m app.ml.train
```

## 5. Manual Local Setup (without Docker)

### 5.1 Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL locally (or run just the db via docker):
docker run --name terrasense_db -e POSTGRES_USER=terrasense \
  -e POSTGRES_PASSWORD=terrasense -e POSTGRES_DB=terrasense \
  -p 5432:5432 -d postgres:16-alpine

# Configure environment
cp ../.env.example .env
# edit DATABASE_URL if needed, e.g.:
# DATABASE_URL=postgresql+psycopg2://terrasense:terrasense@localhost:5432/terrasense

# Generate the synthetic dataset and train the models (creates app/models/*.joblib)
python -m app.ml.train

# Run the API (creates DB tables automatically on startup)
uvicorn app.main:app --reload --port 8000
```

### 5.2 Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
npm run dev
```

Visit http://localhost:3000 — it will redirect to `/dashboard`.

### 5.3 Database Migrations (Alembic)

The app auto-creates tables on startup for zero-friction local development
(`AUTO_CREATE_TABLES=true` by default). For a production-style workflow, use
real Alembic migrations instead:

```bash
cd backend
# Point at your target database (defaults to the DATABASE_URL in .env)
alembic upgrade head          # apply all migrations

# After changing a model in app/db/models.py:
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

Set `AUTO_CREATE_TABLES=false` in production so schema changes only happen
through reviewed migrations, not automatically on boot.

### 5.4 Run the backend test suite

```bash
cd backend
pytest tests/ -v
```

The test suite trains a small model automatically (via a fixture) if none
exists, then exercises the ML pipeline and every API endpoint using an
isolated SQLite database — no external services required to run tests.

### 5.5 Run the frontend test suite

```bash
cd frontend
npm run test          # single run
npm run test:watch    # watch mode
```

Covers the API client (request/response contracts, error handling), utility
functions (score/quality color mapping, date formatting), and UI components
(StatCard, Badge, Progress) using Vitest + React Testing Library.

## 6. Retraining with your own dataset

1. Go to `/datasets` in the UI (or `POST /api/v1/datasets/upload`) and upload a
   CSV containing these columns: `nitrogen, phosphorus, potassium, ph,
   organic_carbon, moisture, temperature, humidity, rainfall, soil_quality`
   (`soil_quality` ∈ {Excellent, Good, Moderate, Poor}).
2. The preview screen validates the columns and shows the first 10 rows.
3. Go to `/models` and click **Train Models** — or call:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/models/train?dataset_id=<id>"
   ```
4. The best model (by macro F1) is automatically saved and activated for
   `/api/v1/predict` inference — no server restart required.

## 7. Key API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/predict` | Run real ML prediction on soil parameters |
| GET | `/api/v1/history` | Searchable/filterable analysis history |
| GET | `/api/v1/fields` | List registered fields (for the map) |
| POST | `/api/v1/fields` | Create a field |
| GET | `/api/v1/models` | List trained model metrics |
| POST | `/api/v1/models/train` | Train LR/RF/XGBoost and activate the best |
| POST | `/api/v1/datasets/upload` | Upload + validate a CSV dataset |
| POST | `/api/v1/datasets/synthetic` | (Re)generate the labeled synthetic dataset |
| GET | `/api/v1/forecast/{field_id}` | Soil-health trend + forecast (use `demo` for a synthetic example) |
| GET | `/api/v1/health` | Health check (DB + model status) |

Full interactive documentation is available at `/docs` (Swagger UI) once the
backend is running.

## 8. Known Limitations / What to Verify in Your Environment

This project was built and tested in a sandboxed environment without a Docker
daemon available, so while `docker-compose.yml` and both Dockerfiles follow
standard, well-tested patterns:

- The backend (pytest, 15 tests), ML pipeline (real training + SHAP), and
  frontend (production build + Vitest suite, 20 tests) were all **actually
  executed and verified passing**.
- `docker compose up --build` itself has **not** been executed end-to-end in
  this environment. If you hit an issue bringing up the containers, check
  first that Docker Desktop / the Docker daemon has enough memory allocated
  (XGBoost + SHAP + Postgres can be memory-hungry on first build) and that
  ports 3000/8000/5432 are free.

## 9. Important Notes

- **Synthetic data disclosure**: the bundled dataset (`data/synthetic_soil_dataset.csv`)
  is generated by `app/ml/data_generator.py` with a `# SYNTHETIC / DEMO DATASET`
  header comment, and every dataset record in the database is flagged
  `is_synthetic`. The frontend visually tags synthetic-derived charts.
- **No hardcoded predictions**: `/api/v1/predict` always calls the persisted,
  trained model (`predict_service.py`); if no model has been trained yet, the
  API returns `503` with a clear message instead of a fake result.
- **Nutrient/crop guidance disclaimer**: nutrient amendment suggestions and crop
  recommendations are general-purpose heuristics for demonstration and are
  explicitly flagged as such — always validate with local agricultural
  guidance before applying fertilizers or amendments.
