from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import bcrypt
from audit import log_audit

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
    
    if getattr(user, 'is_active', None) is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")
        
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
        
    log_audit(db, user_id=user.id, action="LOGIN", resource="System", payload={"role": user.role})
        
    return user

@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        password_hash=hashed_pwd,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

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
