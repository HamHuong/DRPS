from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.post("/login", response_model=schemas.UserResponse)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
    
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
        
    return user

# Helper endpoint to create initial users (for demo purposes)
@router.post("/setup")
def setup_users(db: Session = Depends(get_db)):
    if db.query(models.User).count() == 0:
        admin = models.User(username="admin", password_hash=get_password_hash("admin"), role="admin")
        doctor = models.User(username="doctor", password_hash=get_password_hash("doctor"), role="doctor")
        db.add(admin)
        db.add(doctor)
        db.commit()
        return {"message": "Users created successfully"}
    return {"message": "Users already exist"}
