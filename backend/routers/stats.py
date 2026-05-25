from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
import models, schemas
from typing import List

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/admin/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    # Total predictions
    total_preds = db.query(models.Prediction).count()
    
    # High risk count
    high_risk_count = db.query(models.Prediction).filter(models.Prediction.risk_level == 'High').count()
    
    high_risk_percentage = 0
    if total_preds > 0:
        high_risk_percentage = int((high_risk_count / total_preds) * 100)

    # Active model from MLflow
    import os
    import mlflow
    from mlflow.tracking import MlflowClient
    
    active_model_name = "Unknown"
    auc = 0.0
    recall = 0.0
    
    try:
        MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
        mlflow.set_tracking_uri(MLFLOW_URI)
        client = MlflowClient()
        versions = client.search_model_versions("name='ReadmissionPredictionModel'")
        if versions:
            # Sort by version descending to get latest
            versions = sorted(versions, key=lambda x: int(x.version), reverse=True)
            latest = versions[0]
            run = client.get_run(latest.run_id)
            active_model_name = run.data.params.get("model_type", "Unknown")
            auc = float(run.data.metrics.get("roc_auc", 0.0))
            recall = float(run.data.metrics.get("recall", 0.0))
    except Exception as e:
        print(f"Stats MLflow error: {e}")
    
    return {
        "total_predictions": total_preds,
        "high_risk_percentage": high_risk_percentage,
        "active_model": active_model_name,
        "auc": auc,
        "recall": recall,
        # Demo trend data because we don't have months of real data
        "trend_data": [
            { "name": 'Jan', "auc": 0.81, "recall": 0.75 },
            { "name": 'Feb', "auc": 0.82, "recall": 0.76 },
            { "name": 'Mar', "auc": 0.84, "recall": 0.79 },
            { "name": 'Apr', "auc": 0.85, "recall": 0.82 },
            { "name": 'May', "auc": auc, "recall": recall }
        ]
    }

@router.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    # Return all users for Admin User Management
    users = db.query(models.User).all()
    result = []
    for user in users:
        pred_count = db.query(models.Prediction).filter(models.Prediction.user_id == user.id).count()
        result.append({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "predictions_made": pred_count,
            "created_at": user.created_at
        })
    return result

@router.get("/patients/history")
def get_patient_history(user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Prediction)
    if user_id is not None:
        query = query.filter(models.Prediction.user_id == user_id)
    predictions = query.order_by(models.Prediction.predicted_at.desc()).limit(50).all()
    result = []
    for p in predictions:
        patient = p.patient
        result.append({
            "id": p.id,
            "patient_code": patient.patient_code,
            "patient_name": patient.patient_name,
            "age_group": patient.age_group,
            "probability": p.probability,
            "risk_level": p.risk_level,
            "predicted_at": p.predicted_at
        })
    return result

# --- Profile Endpoints ---
@router.put("/profile/{user_id}")
def update_profile(user_id: int, new_username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.username = new_username
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}
