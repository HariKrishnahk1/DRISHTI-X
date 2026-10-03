import os
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.inference import InferenceRecord
from backend.app.schemas.inference import InferenceRecordResponse, InferenceVerificationResult
from backend.app.provenance.inference_engine import run_cryptographic_inference, verify_inference_record
from backend.app.audit.audit_chain import record_audit_event

router = APIRouter(prefix="/inference", tags=["Inference & Provenance"])

@router.get("", response_model=List[InferenceRecordResponse])
def list_inferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InferenceRecord).order_by(InferenceRecord.sequence_number.desc()).limit(50).all()

@router.post("/run", response_model=InferenceRecordResponse)
async def run_inference_endpoint(
    model_id: str = Form(...),
    image: UploadFile = File(...),
    normalize: bool = Form(True),
    confidence_threshold: float = Form(0.5),
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE, UserRole.CONTRIBUTOR]))
):
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing input image")

    # Store input image securely
    dest_dir = os.path.join(settings.STORAGE_DIR, "inference_inputs")
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, f"{os.path.splitext(image.filename)[0]}_{os.urandom(4).hex()}{os.path.splitext(image.filename)[1]}")
    
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    config = {
        "normalize": normalize,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "target_size": [224, 224],
        "confidence_threshold": confidence_threshold
    }

    record = run_cryptographic_inference(
        db=db,
        model_id=model_id,
        image_path=dest_path,
        preprocessing_config=config
    )

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="INFERENCE_EXECUTION",
        asset_id=record.id,
        details={
            "model_id": model_id,
            "input_hash": record.input_hash,
            "output_hash": record.output_hash,
            "nonce": record.nonce,
            "sequence": record.sequence_number
        }
    )

    return record

@router.get("/{id}", response_model=InferenceRecordResponse)
def get_inference(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(InferenceRecord).filter(InferenceRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Inference record not found")
    return record

@router.post("/{id}/verify", response_model=InferenceVerificationResult)
def verify_inference_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = verify_inference_record(db, inference_id=id)

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="INFERENCE_VERIFICATION",
        asset_id=id,
        details={
            "status": result["status"],
            "tamper_detected": result["tamper_detected"],
            "failures": result["failure_reasons"]
        }
    )

    return result

@router.post("/{id}/tamper", response_model=InferenceRecordResponse)
def tamper_inference_for_testing(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    """Controlled test helper: Injects malicious alterations into stored prediction output without re-signing."""
    record = db.query(InferenceRecord).filter(InferenceRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Inference record not found")

    data = json.loads(record.output_data)
    # Alter prediction maliciously
    data["class_label"] = "CIVILIAN_VEHICLE"
    data["confidence"] = 0.99
    data["bounding_box"] = [0, 0, 10, 10]
    record.output_data = json.dumps(data)
    record.is_verified = False
    record.verification_status = "INTEGRITY_FAILURE"

    db.commit()
    db.refresh(record)

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="INFERENCE_TAMPER_SIMULATED",
        asset_id=id,
        details={"altered_field": "output_data", "test_scenario": "adversarial_output_injection"}
    )
    return record

@router.post("/{id}/replay", response_model=InferenceRecordResponse)
def simulate_replay_attack(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    """Controlled test helper: Marks this record as replayed or duplicates sequence counter."""
    record = db.query(InferenceRecord).filter(InferenceRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Inference record not found")

    record.is_replayed = True
    record.is_verified = False
    record.verification_status = "REPLAY_DETECTED"
    db.commit()
    db.refresh(record)

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="INFERENCE_REPLAY_SIMULATED",
        asset_id=id,
        details={"replayed_nonce": record.nonce}
    )
    return record
