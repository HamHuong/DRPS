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

    # Active model
    # Assuming best_model.pkl is loaded, we might not have a DB record synced yet.
    # We will just return a static name or the latest MLModel from DB if available.
    latest_model = db.query(models.MLModel).order_by(models.MLModel.id.desc()).first()
    active_model_name = latest_model.name if latest_model else "Logistic_Regression_v1"
    auc = latest_model.auc_roc if latest_model else 0.86
    recall = latest_model.f1_score if latest_model else 0.84 # Demo placeholder if no db model
    
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
    # Return all doctors
    doctors = db.query(models.User).filter(models.User.role == 'doctor').all()
    # Also get prediction count per doctor
    result = []
    for doc in doctors:
        pred_count = db.query(models.Prediction).filter(models.Prediction.user_id == doc.id).count()
        result.append({
            "id": doc.id,
            "username": doc.username,
            "is_active": doc.is_active,
            "predictions_made": pred_count,
            "created_at": doc.created_at
        })
    return result

@router.get("/patients/history")
def get_patient_history(db: Session = Depends(get_db)):
    # Lấy lịch sử dự đoán mới nhất, kèm tên bệnh nhân
    predictions = db.query(models.Prediction).order_by(models.Prediction.predicted_at.desc()).limit(50).all()
    result = []
    for p in predictions:
        patient = p.patient
        result.append({
            "id": p.id,
            "patient_code": patient.patient_code,
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
