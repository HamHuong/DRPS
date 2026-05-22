import os
import mlflow
import joblib
import warnings
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE

from preprocessing import load_data, preprocess_data, create_preprocessor

warnings.filterwarnings("ignore")

# Setup MLflow
os.environ["MLFLOW_TRACKING_URI"] = "http://localhost:5000" # Local run, change to http://mlflow:5000 inside docker
mlflow.set_tracking_uri(os.environ["MLFLOW_TRACKING_URI"])
mlflow.set_experiment("DRPS_Readmission_Prediction")

def train_and_log_model(model_name, model, X_train, y_train, X_test, y_test, preprocessor):
    with mlflow.start_run(run_name=model_name) as run:
        print(f"Training {model_name}...")
        
        # Create pipeline with SMOTE
        pipeline = ImbPipeline(steps=[
            ('preprocessor', preprocessor),
            ('smote', SMOTE(random_state=42)),
            ('classifier', model)
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        
        # Predict
        y_pred = pipeline.predict(X_test)
        y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        print(f"Metrics for {model_name}: ROC-AUC: {roc_auc:.4f}, Recall: {rec:.4f}")
        
        # Log to MLflow
        mlflow.log_param("model_type", model_name)
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("precision", prec)
        mlflow.log_metric("recall", rec)
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("roc_auc", roc_auc)
        
        mlflow.sklearn.log_model(pipeline, "model")
        
        return pipeline, roc_auc, rec, run.info.run_id

if __name__ == "__main__":
    print("Loading data...")
    try:
        # Assuming run from ml_pipeline folder
        df = load_data('../dataset/diabetic_data.csv')
    except Exception as e:
        print(f"Error loading data: {e}")
        # Try parent folder just in case
        df = load_data('dataset/diabetic_data.csv')
        
    X, y = preprocess_data(df)
    preprocessor = create_preprocessor()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    models = {
        "Logistic_Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random_Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }
    
    best_model = None
    best_score = 0
    best_features = X.columns.tolist()
    best_run_id = None
    
    os.makedirs('models', exist_ok=True)
    
    for name, model in models.items():
        try:
            pipeline, roc_auc, rec, run_id = train_and_log_model(name, model, X_train, y_train, X_test, y_test, preprocessor)
            # Combine ROC-AUC and Recall for selection, giving priority to both
            score = roc_auc + rec
            if score > best_score:
                best_score = score
                best_model = pipeline
                best_run_id = run_id
                print(f"New best model: {name}")
        except Exception as e:
            print(f"Failed to train {name}: {e}")
            
    if best_model:
        # Register best model in MLflow Model Registry
        if best_run_id:
            try:
                model_uri = f"runs:/{best_run_id}/model"
                mlflow.register_model(model_uri, "ReadmissionPredictionModel")
                print(f"Registered best model in MLflow under name 'ReadmissionPredictionModel'")
            except Exception as e:
                print(f"Could not register model in MLflow: {e}")

        # Save the best pipeline and its feature names so the API knows what to expect
        artifact = {
            'model': best_model,
            'features': best_features
        }
        joblib.dump(artifact, 'models/best_model.pkl')
        print("Best model saved to models/best_model.pkl")
