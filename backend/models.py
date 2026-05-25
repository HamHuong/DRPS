from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="doctor") # admin, doctor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True)
    patient_name = Column(String, nullable=True)
    race = Column(String)
    gender = Column(String)
    age_group = Column(String)
    time_in_hospital = Column(Integer)
    num_lab_procedures = Column(Integer)
    num_medications = Column(Integer)
    number_diagnoses = Column(Integer)
    number_outpatient = Column(Integer)
    number_emergency = Column(Integer)
    number_inpatient = Column(Integer)
    A1Cresult = Column(String)
    insulin = Column(String)
    change = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    predictions = relationship("Prediction", back_populates="patient")

class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    version = Column(String)
    algorithm = Column(String)
    auc_roc = Column(Float)
    f1_score = Column(Float)
    is_active = Column(Boolean, default=False)
    mlflow_run_id = Column(String)
    artifact_path = Column(String)
    trained_at = Column(DateTime, default=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    model_id = Column(Integer, ForeignKey("ml_models.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    probability = Column(Float)
    risk_level = Column(String)
    readmitted_label = Column(Boolean, default=False)
    shap_values = Column(JSON, nullable=True)
    predicted_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="predictions")
    shap_explanations = relationship("ShapExplanation", back_populates="prediction", uselist=False)

class ShapExplanation(Base):
    __tablename__ = "shap_explanations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    feature_importances = Column(JSON)
    base_value = Column(Float)
    plot_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prediction = relationship("Prediction", back_populates="shap_explanations")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    resource = Column(String)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
