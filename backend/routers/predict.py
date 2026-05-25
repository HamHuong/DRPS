import os
import joblib
import pandas as pd
import shap
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import numpy as np

router = APIRouter(prefix="/predict", tags=["predict"])

# Global variable to hold the loaded model and explainer
ml_model = None
explainer = None
expected_features = None

def load_model():
    global ml_model, explainer, expected_features
    model_path = os.getenv("MODEL_PATH", "/app/ml_pipeline/models/best_model.pkl")
    if os.path.exists(model_path):
        try:
            artifact = joblib.load(model_path)
            ml_model = artifact['model']
            expected_features = artifact['features']
            # Initialize SHAP Explainer based on model type (TreeExplainer for XGB/RF, LinearExplainer for LR)
            # Assuming Tree model for now as requested (XGBoost/RandomForest)
            try:
                explainer = shap.TreeExplainer(ml_model)
            except:
                explainer = None
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Model not found at {model_path}. Please train the model first.")

# Try to load model at startup
load_model()

def preprocess_input(data: schemas.PredictionRequest):
    # Convert input to DataFrame
    df = pd.DataFrame([data.dict()])
    
    # Rename age_group to age to match the model's training features
    if 'age_group' in df.columns:
        df.rename(columns={'age_group': 'age'}, inplace=True)
        
    return df

@router.post("/", response_model=schemas.PredictionResponse)
def predict(request: schemas.PredictionRequest, db: Session = Depends(get_db)):
    if ml_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Please train the model.")

    try:
        # Preprocess input data
        input_df = preprocess_input(request)
        
        # Ensure correct column order
        if expected_features:
            # Add missing columns with 0 (for one-hot encoded cols that might be missing)
            for col in expected_features:
                if col not in input_df.columns:
                    input_df[col] = 0
            input_df = input_df[expected_features]

        # Predict probability
        proba = ml_model.predict_proba(input_df)[0][1] # Probability of class 1 (<30 days)
        
        # Risk level logic
        risk_level = "High" if proba > 0.5 else "Low"

        # Calculate SHAP values
        shap_dict = None
        if explainer:
            try:
                shap_values = explainer.shap_values(input_df)
                # Ensure shap_values is a 1D array for a single instance
                if isinstance(shap_values, list): # For some tree models, it returns a list per class
                    sv = shap_values[1][0]
                else:
                    sv = shap_values[0]
                
                shap_dict = {feat: float(val) for feat, val in zip(input_df.columns, sv)}
            except Exception as e:
                print(f"SHAP error: {e}")

        # Save patient to DB (if not exists)
        patient = db.query(models.Patient).filter(models.Patient.patient_code == request.patient_code).first()
        if not patient:
            patient = models.Patient(**request.dict(exclude={"user_id"}), created_by=request.user_id or 1)
            db.add(patient)
            db.commit()
            db.refresh(patient)
        elif request.patient_name and patient.patient_name != request.patient_name:
            patient.patient_name = request.patient_name
            db.commit()
            db.refresh(patient)

        # Save prediction log to DB
        prediction_record = models.Prediction(
            patient_id=patient.id,
            probability=float(proba),
            risk_level=risk_level,
            readmitted_label=(risk_level=="High"),
            shap_values=shap_dict,
            user_id=request.user_id or 1
        )
        db.add(prediction_record)
        db.commit()

        return schemas.PredictionResponse(
            probability=float(proba),
            risk_level=risk_level,
            shap_values=shap_dict
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reload")
def reload_model():
    load_model()
    return {"message": "Model reload triggered"}
