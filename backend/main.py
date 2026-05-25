from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, predict, stats, mlops

# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Readmission Prediction System API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. In prod, specify ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(stats.router)
app.include_router(mlops.router)

@app.get("/")
def root():
    return {"message": "Welcome to DRPS API. Please check /docs for API documentation."}
