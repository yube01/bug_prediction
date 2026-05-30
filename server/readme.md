python -m venv venv


venv\Scripts\activate

uvicorn main:app --reload



# Bug Prediction System — FastAPI

## Folder Structure
```
bugapi/
├── main.py                     ← FastAPI app
├── requirements.txt            ← dependencies
├── bug_prediction_model.pkl    ← trained model (copy from notebook)
├── encoder_language.pkl        ← language encoder
├── encoder_period.pkl          ← time period encoder
└── feature_cols.pkl            ← feature list
```

## Setup & Run

### Step 1 — Copy your model files
Copy these 4 files from your notebook folder into this folder:
```
bug_prediction_model.pkl
encoder_language.pkl
encoder_period.pkl
feature_cols.pkl
```

### Step 2 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3 — Run the server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4 — Open the docs
Go to: http://localhost:8000/docs

---

## API Endpoints

### GET /health
Check if server is running.
```bash
curl http://localhost:8000/health
```

### GET /model/info
Get model details, features, and metrics.
```bash
curl http://localhost:8000/model/info
```

### POST /predict
Predict bug risk for one commit.
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "lines_added": 450,
    "lines_deleted": 80,
    "files_changed": 15,
    "avg_complexity": 12.5,
    "num_methods": 20,
    "test_files_changed": 0,
    "test_ratio": 0.0,
    "complexity_per_file": 0.83,
    "churn_ratio": 5.6,
    "prior_bugs_author": 5,
    "commit_hour": 23,
    "day_of_week": 6,
    "is_weekend": 1,
    "is_night_commit": 1,
    "language_group": "Python",
    "time_period": "2024-2026"
  }'
```

**Response:**
```json
{
  "bug_probability": 0.78,
  "risk_level": "HIGH RISK",
  "risk_icon": "🔴",
  "risk_score": 78,
  "recommendation": "Mandatory review required before merge.",
  "top_risk_factors": [
    "Author caused 5 bugs before",
    "High complexity (12.5)",
    "No test files updated"
  ]
}
```

### POST /predict/batch
Predict multiple commits at once (max 500).
```bash
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{
    "commits": [
      {"lines_added": 450, "prior_bugs_author": 5, ...},
      {"lines_added": 10,  "prior_bugs_author": 0, ...}
    ]
  }'
```

**Response:**
```json
{
  "total": 2,
  "high_risk": 1,
  "medium_risk": 0,
  "low_risk": 1,
  "predictions": [...]
}
```

---

## Risk Levels

| Probability | Level | Icon | Action |
|---|---|---|---|
| 0.00 - 0.30 | LOW RISK | 🟢 | Safe to merge |
| 0.30 - 0.60 | MEDIUM RISK | 🟡 | Review recommended |
| 0.60 - 1.00 | HIGH RISK | 🔴 | Mandatory review |

---

## Model Info

| Metric | Value |
|---|---|
| Algorithm | Random Forest (200 trees) |
| Training data | 16,722 commits |
| Languages | Python + TypeScript |
| Time span | 2018 - 2026 |
| Test AUC | 0.869 |
| Precision | 0.297 |
| Recall | 0.623 |
| Top feature | prior_bugs_author (39%) |