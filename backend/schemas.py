from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# --- User Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    
    class Config:
        orm_mode = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    patient_code: str
    race: str
    gender: str
    age_group: str
    time_in_hospital: int = Field(..., ge=1, le=14, description="Number of days in hospital (1-14)")
    num_lab_procedures: int = Field(..., ge=1, le=150, description="Number of lab procedures performed")
    num_medications: int = Field(..., ge=1, le=100, description="Number of distinct medications")
    number_diagnoses: int = Field(..., ge=1, le=20, description="Number of diagnoses")
    number_outpatient: int = Field(0, ge=0)
    number_emergency: int = Field(0, ge=0)
    number_inpatient: int = Field(0, ge=0)
    A1Cresult: str
    insulin: str
    change: str

class PatientCreate(PatientBase):
    pass

# --- Prediction Schemas ---
class PredictionRequest(PatientBase):
    pass

class PredictionResponse(BaseModel):
    probability: float
    risk_level: str
    shap_values: Optional[Dict[str, float]] = None

# --- ML Model Schemas ---
class MLModelResponse(BaseModel):
    id: int
    name: str
    version: str
    algorithm: str
    auc_roc: float
    f1_score: float
    is_active: bool
    trained_at: datetime
    
    class Config:
        orm_mode = True
