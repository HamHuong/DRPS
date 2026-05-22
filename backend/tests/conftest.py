import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test database BEFORE importing main
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from main import app
from database import Base, get_db
from models import User
from routers.auth import get_password_hash

# Create a fresh test engine
engine = create_engine(
    "sqlite:///:memory:", 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def db_session():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test users
    admin_user = User(username="testadmin", password_hash=get_password_hash("adminpass"), role="admin", is_active=True)
    doctor_user = User(username="testdoc", password_hash=get_password_hash("docpass"), role="doctor", is_active=True)
    db.add(admin_user)
    db.add(doctor_user)
    db.commit()
    
    yield db
    
    # Teardown
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def client(db_session):
    return TestClient(app)
