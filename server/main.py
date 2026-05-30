"""
Bug Prediction System — FastAPI
================================
Loads the trained model and exposes 3 endpoints:

  POST /predict        → predict one commit
  POST /predict/batch  → predict many commits at once
  GET  /health         → check server is running
  GET  /model/info     → model details and feature list
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import numpy as np
import joblib
import os

# ── Load model files ─────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model        = joblib.load(os.path.join(BASE_DIR, 'bug_prediction_model.pkl'))
    le_lang      = joblib.load(os.path.join(BASE_DIR, 'encoder_language.pkl'))
    le_period    = joblib.load(os.path.join(BASE_DIR, 'encoder_period.pkl'))
    FEATURES     = joblib.load(os.path.join(BASE_DIR, 'feature_cols.pkl'))
    MODEL_LOADED = True
    print("✅ Model loaded successfully")
    print(f"   Features   : {len(FEATURES)}")
    print(f"   Languages  : {list(le_lang.classes_)}")
    print(f"   Periods    : {list(le_period.classes_)}")
except Exception as e:
    MODEL_LOADED = False
    print(f"❌ Model load failed: {e}")
    print("   Place .pkl files in same folder as main.py")

# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title       = "Bug Prediction System",
    description = "Predicts whether a commit is likely to introduce a bug using Random Forest trained on 16,722 real GitHub commits (Python + TypeScript, 2018-2026)",
    version     = "1.0.0",
)

# Allow all origins (for testing — restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Request schema ────────────────────────────────────────────
class CommitFeatures(BaseModel):
    # Size features
    lines_added         : float = Field(default=0,   description="Lines of code added")
    lines_deleted       : float = Field(default=0,   description="Lines of code removed")
    files_changed       : float = Field(default=1,   description="Number of files changed")
    churn_ratio         : float = Field(default=1.0, description="lines_added / (lines_deleted + 1)")

    # Complexity features
    avg_complexity      : float = Field(default=1.0, description="Average cyclomatic complexity of changed methods")
    num_methods         : float = Field(default=0,   description="Number of methods changed")
    complexity_per_file : float = Field(default=0.0, description="avg_complexity / files_changed")

    # Test features
    test_files_changed  : float = Field(default=0,   description="Number of test files changed")
    test_ratio          : float = Field(default=0.0, description="test_files / files_changed (0-1)")

    # Developer history
    prior_bugs_author   : float = Field(default=0,   description="How many bugs this author caused before this commit")

    # Timing features
    commit_hour         : int   = Field(default=12,  description="Hour of commit (0-23)")
    day_of_week         : int   = Field(default=0,   description="Day of week (0=Mon to 6=Sun)")
    is_weekend          : int   = Field(default=0,   description="1 if weekend, 0 if weekday")
    is_night_commit     : int   = Field(default=0,   description="1 if committed after 10pm or before 5am")

    # Context
    language_group      : str   = Field(default="Python",    description="Language: Python or TypeScript")
    time_period         : str   = Field(default="2024-2026", description="Era: 2018-2020, 2021-2023, or 2024-2026")

    class Config:
        json_schema_extra = {
            "example": {
                "lines_added"        : 450,
                "lines_deleted"      : 80,
                "files_changed"      : 15,
                "churn_ratio"        : 5.6,
                "avg_complexity"     : 12.5,
                "num_methods"        : 20,
                "complexity_per_file": 0.83,
                "test_files_changed" : 0,
                "test_ratio"         : 0.0,
                "prior_bugs_author"  : 5,
                "commit_hour"        : 23,
                "day_of_week"        : 6,
                "is_weekend"         : 1,
                "is_night_commit"    : 1,
                "language_group"     : "Python",
                "time_period"        : "2024-2026"
            }
        }


class BatchRequest(BaseModel):
    commits: List[CommitFeatures] = Field(description="List of commits to predict")


# ── Response schema ───────────────────────────────────────────
class PredictionResponse(BaseModel):
    bug_probability : float
    risk_level      : str
    risk_icon       : str
    risk_score      : int
    recommendation  : str
    top_risk_factors: List[str]


class BatchResponse(BaseModel):
    total           : int
    high_risk       : int
    medium_risk     : int
    low_risk        : int
    predictions     : List[PredictionResponse]


# ── Helper functions ──────────────────────────────────────────
def encode_input(commit: CommitFeatures) -> pd.DataFrame:
    """Convert CommitFeatures to model input DataFrame."""
    data = commit.model_dump()

    # Encode language
    lang = data.get('language_group', 'Python')
    data['lang_enc'] = (
        int(le_lang.transform([lang])[0])
        if lang in le_lang.classes_ else 0
    )

    # Encode time period
    period = data.get('time_period', '2024-2026')
    data['period_enc'] = (
        int(le_period.transform([period])[0])
        if period in le_period.classes_ else 2
    )

    row = pd.DataFrame([{col: data.get(col, 0) for col in FEATURES}])
    return row


def get_risk_factors(commit: CommitFeatures) -> List[str]:
    """Return top risk factors for this commit in plain English."""
    factors = []
    d = commit.model_dump()

    if d['prior_bugs_author'] >= 3:
        factors.append(f"Author caused {int(d['prior_bugs_author'])} bugs before")
    if d['avg_complexity'] >= 10:
        factors.append(f"High complexity ({d['avg_complexity']:.1f})")
    if d['test_ratio'] == 0 and d['files_changed'] > 0:
        factors.append("No test files updated")
    if d['lines_added'] >= 300:
        factors.append(f"Large commit ({int(d['lines_added'])} lines added)")
    if d['files_changed'] >= 10:
        factors.append(f"Many files touched ({int(d['files_changed'])} files)")
    if d['is_night_commit'] == 1:
        factors.append("Late night commit")
    if d['is_weekend'] == 1:
        factors.append("Weekend commit")
    if d['churn_ratio'] >= 5:
        factors.append(f"High churn ratio ({d['churn_ratio']:.1f})")

    return factors[:3] if factors else ["No major risk factors detected"]


def make_prediction(commit: CommitFeatures) -> PredictionResponse:
    """Run model and return structured prediction."""
    row  = encode_input(commit)
    prob = float(model.predict_proba(row)[0][1])
    score = int(prob * 100)

    if prob >= 0.6:
        risk_level = "HIGH RISK"
        risk_icon  = "🔴"
        recommendation = "Mandatory review required before merge. Consider breaking into smaller commits and adding tests."
    elif prob >= 0.3:
        risk_level = "MEDIUM RISK"
        risk_icon  = "🟡"
        recommendation = "Review recommended. Check test coverage and complexity before merging."
    else:
        risk_level = "LOW RISK"
        risk_icon  = "🟢"
        recommendation = "Looks safe to merge. Standard review process applies."

    return PredictionResponse(
        bug_probability  = round(prob, 4),
        risk_level       = risk_level,
        risk_icon        = risk_icon,
        risk_score       = score,
        recommendation   = recommendation,
        top_risk_factors = get_risk_factors(commit),
    )


# ── Endpoints ─────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    """Check if API and model are running."""
    return {
        "status"      : "ok" if MODEL_LOADED else "error",
        "model_loaded": MODEL_LOADED,
        "version"     : "1.0.0",
        "description" : "Bug Prediction System API",
    }


@app.get("/model/info", tags=["System"])
def model_info():
    """Return model details, features, and encoding info."""
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        "model_type"        : "Random Forest",
        "training_data"     : "16,722 GitHub commits (Python + TypeScript, 2018-2026)",
        "test_auc"          : 0.869,
        "test_precision"    : 0.297,
        "test_recall"       : 0.623,
        "test_f1"           : 0.402,
        "top_predictor"     : "prior_bugs_author (39% importance)",
        "features"          : FEATURES,
        "languages"         : list(le_lang.classes_),
        "time_periods"      : list(le_period.classes_),
        "risk_thresholds"   : {
            "low"   : "0.00 - 0.30",
            "medium": "0.30 - 0.60",
            "high"  : "0.60 - 1.00",
        }
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_single(commit: CommitFeatures):
    """
    Predict bug risk for a single commit.

    Returns:
    - bug_probability: 0.0 to 1.0
    - risk_level: LOW / MEDIUM / HIGH
    - recommendation: what to do
    - top_risk_factors: why it was flagged
    """
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not loaded. Place .pkl files in same folder as main.py")
    try:
        return make_prediction(commit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch", response_model=BatchResponse, tags=["Prediction"])
def predict_batch(request: BatchRequest):
    """
    Predict bug risk for multiple commits at once.

    Returns individual predictions plus summary counts.
    """
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if len(request.commits) == 0:
        raise HTTPException(status_code=400, detail="No commits provided")
    if len(request.commits) > 500:
        raise HTTPException(status_code=400, detail="Max 500 commits per batch")

    try:
        predictions = [make_prediction(c) for c in request.commits]
        return BatchResponse(
            total       = len(predictions),
            high_risk   = sum(1 for p in predictions if p.risk_level == "HIGH RISK"),
            medium_risk = sum(1 for p in predictions if p.risk_level == "MEDIUM RISK"),
            low_risk    = sum(1 for p in predictions if p.risk_level == "LOW RISK"),
            predictions = predictions,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")