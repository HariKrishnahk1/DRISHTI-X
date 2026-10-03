import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.dataset import Dataset, DatasetSample
from backend.app.schemas.dataset import DatasetResponse, DatasetDetailResponse, DatasetAnalysisResult, DatasetSampleResponse
from backend.app.services.dataset_service import ingest_dataset_archive
from backend.app.cv.data_integrity import analyze_dataset_integrity
from backend.app.audit.audit_chain import record_audit_event

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dataset)
    if current_user.role == UserRole.CONTRIBUTOR.value:
        query = query.filter(Dataset.contributor_name == current_user.username)
    if search:
        query = query.filter(Dataset.name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Dataset.status == status_filter)
    return query.order_by(Dataset.created_at.desc()).all()

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    version: str = Form("1.0.0"),
    format_type: str = Form("YOLO"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.CONTRIBUTOR, UserRole.ANALYST, UserRole.DEFENCE]))
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    
    # Save upload temporarily
    temp_dir = os.path.join(settings.STORAGE_DIR, "tmp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        dataset = ingest_dataset_archive(
            db=db,
            archive_path=temp_file_path,
            name=name,
            contributor_name=current_user.username,
            version=version,
            dataset_format=format_type,
            actor=current_user.username,
            role=current_user.role
        )
        return dataset
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/{id}", response_model=DatasetDetailResponse)
def get_dataset(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.get("/{id}/samples", response_model=List[DatasetSampleResponse])
def get_dataset_samples(
    id: str,
    suspicious_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.app.cv.visualizer import generate_sample_thumbnail_base64, generate_trigger_heatmap_base64
    query = db.query(DatasetSample).filter(DatasetSample.dataset_id == id)
    if suspicious_only:
        query = query.filter(DatasetSample.is_suspicious == True)
    samples = query.limit(60).all()

    result = []
    for s in samples:
        dto = DatasetSampleResponse.from_orm(s) if hasattr(DatasetSampleResponse, "from_orm") else DatasetSampleResponse.model_validate(s)
        if s.file_path and os.path.exists(s.file_path):
            dto.thumbnail_url = generate_sample_thumbnail_base64(s.file_path, max_size=180)
            if s.is_suspicious and s.anomaly_type == "TRIGGER_CANDIDATE":
                dto.heatmap_url = generate_trigger_heatmap_base64(s.file_path)
        result.append(dto)
    return result


@router.post("/{id}/analyze", response_model=DatasetAnalysisResult)
def analyze_dataset(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE, UserRole.CONTRIBUTOR]))
):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    result = analyze_dataset_integrity(db, dataset_id=id)

    # Record in audit trail
    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="DATASET_ANALYSIS",
        asset_id=dataset.id,
        details={
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "suspicious_count": result["suspicious_samples_count"],
            "recommended_disposition": result["recommended_disposition"]
        }
    )

    return result
