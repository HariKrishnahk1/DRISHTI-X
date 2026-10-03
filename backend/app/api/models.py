import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.model_entity import MLModel
from backend.app.schemas.model_schema import MLModelResponse, ModelAnalysisResult
from backend.app.services.model_service import ingest_model_file
from backend.app.ml.model_analyzer import analyze_model_integrity
from backend.app.audit.audit_chain import record_audit_event

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[MLModelResponse])
def list_models(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MLModel)
    if search:
        query = query.filter(MLModel.name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(MLModel.status == status_filter)
    return query.order_by(MLModel.created_at.desc()).all()

@router.post("/upload", response_model=MLModelResponse)
async def upload_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    version: str = Form("1.0.0"),
    format_type: str = Form("ONNX"),
    expected_hash: Optional[str] = Form(None),
    access_level: str = Form("WHITE_BOX"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.VENDOR, UserRole.ANALYST, UserRole.DEFENCE]))
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    temp_dir = os.path.join(settings.MODELS_DIR, "tmp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        model = ingest_model_file(
            db=db,
            uploaded_file_path=temp_file_path,
            name=name,
            version=version,
            format_type=format_type,
            expected_hash=expected_hash,
            access_level=access_level,
            contributor_name=current_user.organization or current_user.username,
            actor=current_user.username,
            role=current_user.role
        )
        return model
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/{id}", response_model=MLModelResponse)
def get_model(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    model = db.query(MLModel).filter(MLModel.id == id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.post("/{id}/analyze", response_model=ModelAnalysisResult)
def analyze_model(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE, UserRole.VENDOR]))
):
    model = db.query(MLModel).filter(MLModel.id == id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    result = analyze_model_integrity(db, model_id=id)

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="MODEL_ANALYSIS",
        asset_id=model.id,
        details={
            "model_hash": result["model_hash"],
            "is_substituted": result["is_substituted"],
            "risk_score": result["risk_score"],
            "fingerprint_deviation": result["fingerprint_deviation"],
            "recommended_disposition": result["recommended_disposition"]
        }
    )

    return result
