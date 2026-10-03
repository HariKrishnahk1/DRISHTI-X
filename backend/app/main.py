import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.auth import router as auth_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.models import router as models_router
from backend.app.api.inference import router as inference_router
from backend.app.api.shift import router as shift_router
from backend.app.api.evidence import router as evidence_router
from backend.app.api.assets import router as assets_router
from backend.app.api.audit import router as audit_router
from backend.app.api.reports import router as reports_router
from backend.app.api.demo import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Defence AI Vision Integrity & Assurance Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file access for air-gapped evidence and image inspection
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.DEMO_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")
app.mount("/static/demo", StaticFiles(directory=settings.DEMO_DIR), name="demo")

# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(inference_router, prefix=settings.API_V1_STR)
app.include_router(shift_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(assets_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": settings.PROJECT_NAME,
        "mode": "AIR_GAPPED_LOCAL_SECURE",
        "version": settings.VERSION
    }
