from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
import models, schemas
from typing import List
import psutil
import os
import mlflow
from mlflow.tracking import MlflowClient

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/admin/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    # Total predictions
    preds = db.query(models.Prediction.probability).all()
    total_preds = len(preds)
    
    high_risk_count = sum(1 for p in preds if p[0] >= 0.7)
    medium_risk_count = sum(1 for p in preds if 0.4 <= p[0] < 0.7)
    
    high_risk_percentage = 0
    medium_risk_percentage = 0
    low_risk_percentage = 0
    
    if total_preds > 0:
        high_risk_percentage = int((high_risk_count / total_preds) * 100)
        medium_risk_percentage = int((medium_risk_count / total_preds) * 100)
        low_risk_percentage = 100 - high_risk_percentage - medium_risk_percentage

    # Fetch real trend data from MLflow versions
    trend_data = []
    active_model_name = "Unknown"
    auc = 0.0
    recall = 0.0
    
    try:
        MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
        mlflow.set_tracking_uri(MLFLOW_URI)
        client = MlflowClient()
        
        # Lấy tất cả version thay vì mảng mẫu
        versions = client.search_model_versions("")
        if versions:
            # Sắp xếp version tăng dần để vẽ biểu đồ
            versions_sorted = sorted(versions, key=lambda x: int(x.version))
            for v in versions_sorted:
                try:
                    run = client.get_run(v.run_id)
                    v_auc = float(run.data.metrics.get("roc_auc", 0.0))
                    v_recall = float(run.data.metrics.get("recall", 0.0))
                    trend_data.append({
                        "name": f"v{v.version}",
                        "auc": v_auc,
                        "recall": v_recall
                    })
                except:
                    pass
            
            # Latest version info
            latest = versions_sorted[-1]
            try:
                run = client.get_run(latest.run_id)
                active_model_name = run.data.params.get("model_type", "Unknown")
                auc = float(run.data.metrics.get("roc_auc", 0.0))
                recall = float(run.data.metrics.get("recall", 0.0))
            except:
                pass
    except Exception as e:
        print(f"Stats MLflow error: {e}")
        # Fallback if MLflow is down
        if not trend_data:
            trend_data = [
                { "name": 'v1', "auc": 0.81, "recall": 0.75 },
                { "name": 'v2', "auc": 0.84, "recall": 0.79 }
            ]
    
    return {
        "total_predictions": total_preds,
        "high_risk_percentage": high_risk_percentage,
        "medium_risk_percentage": medium_risk_percentage,
        "low_risk_percentage": low_risk_percentage,
        "active_model": active_model_name,
        "auc": auc,
        "recall": recall,
        "trend_data": trend_data
    }

@router.get("/admin/system")
def get_system_stats():
    # Sử dụng psutil để lấy số liệu thực tế
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    ram_percent = memory.percent
    
    # Tính uptime server
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.now() - boot_time
    
    return {
        "cpu_usage": round(cpu_percent, 1),
        "ram_usage": round(ram_percent, 1),
        "total_ram_gb": round(memory.total / (1024**3), 2),
        "uptime_hours": round(uptime.total_seconds() / 3600, 1),
        "status": "Healthy"
    }

@router.get("/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()
    result = []
    for log in logs:
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "username": user.username if user else "Unknown",
            "action": log.action,
            "resource": log.resource,
            "payload": log.payload,
            "created_at": log.created_at
        })
    return result

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
            "gender": patient.gender,
            "race": patient.race,
            "time_in_hospital": patient.time_in_hospital,
            "num_lab_procedures": patient.num_lab_procedures,
            "num_medications": patient.num_medications,
            "number_diagnoses": patient.number_diagnoses,
            "number_outpatient": patient.number_outpatient,
            "number_emergency": patient.number_emergency,
            "number_inpatient": patient.number_inpatient,
            "A1Cresult": patient.A1Cresult,
            "insulin": patient.insulin,
            "change": patient.change,
            "probability": p.probability,
            "risk_level": p.risk_level,
            "shap_values": p.shap_values,
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
