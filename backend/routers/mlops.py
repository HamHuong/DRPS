import os
import mlflow
from mlflow.tracking import MlflowClient
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/mlops", tags=["mlops"])

MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
mlflow.set_tracking_uri(MLFLOW_URI)

@router.get("/registry")
def get_registered_models():
    try:
        client = MlflowClient()
        model_name = "ReadmissionPredictionModel"
        
        try:
            versions = client.search_model_versions(f"name='{model_name}'")
        except Exception as e:
            return {"status": "error", "message": f"Model {model_name} not found in registry", "models": []}
            
        result = []
        for mv in versions:
            run_id = mv.run_id
            try:
                run = client.get_run(run_id)
                model_type = run.data.params.get("model_type", "Unknown")
                roc_auc = float(run.data.metrics.get("roc_auc", 0.0))
                recall = float(run.data.metrics.get("recall", 0.0))
            except:
                model_type = "Unknown"
                roc_auc = 0.0
                recall = 0.0
                
            result.append({
                "version": f"v{mv.version}",
                "algorithm": model_type,
                "auc_roc": round(roc_auc, 2),
                "recall": round(recall, 2),
                "status": "Production" if mv.version == "1" else mv.current_stage, # Fallback display
                "run_id": run_id
            })
            
        result = sorted(result, key=lambda x: int(x["version"].replace('v', '')), reverse=True)
        
        if len(result) > 0 and result[0]["status"] == "None":
            result[0]["status"] = "Production"
            
        return {"status": "success", "models": result}
        
    except Exception as e:
        print(f"Error fetching from MLflow: {e}")
        return {"status": "error", "message": str(e), "models": []}
