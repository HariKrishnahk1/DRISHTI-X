import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DRISHTI-X"
    FULL_TITLE: str = "Defence AI Vision Integrity & Assurance Platform"
    PROBLEM_STATEMENT_ID: str = "MoD-DGIS-CV-01"
    DEPARTMENT: str = "Ministry of Defence / Indian Army / DGIS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Air-gapped / Local execution flag
    AIR_GAPPED_MODE: bool = True
    
    # Cryptographic keys and tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "drishti-x-defence-assurance-secret-key-32bytes-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./drishti_x.db")
    
    # File Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STORAGE_DIR: str = os.path.join(BASE_DIR, "data", "uploads")
    DEMO_DIR: str = os.path.join(BASE_DIR, "data", "demo")
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "data", "reports")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.DEMO_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
