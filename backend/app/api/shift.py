from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.assurance import DistributionShiftRecord
from backend.app.schemas.assurance import DistributionShiftRequest, DistributionShiftResponse
from backend.app.shift.shift_analyzer import analyze_distribution_shift
from backend.app.audit.audit_chain import record_audit_event

router = APIRouter(prefix="/shift", tags=["Distribution Shift"])

@router.get("", response_model=List[DistributionShiftResponse])
def list_shift_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DistributionShiftRecord).order_by(DistributionShiftRecord.created_at.desc()).all()

@router.post("/analyze", response_model=DistributionShiftResponse)
def run_shift_analysis(
    request: DistributionShiftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    try:
        record = analyze_distribution_shift(
            db=db,
            baseline_id=request.baseline_id,
            target_id=request.target_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="DISTRIBUTION_SHIFT_ANALYSIS",
        asset_id=record.id,
        details={
            "baseline_id": request.baseline_id,
            "target_id": request.target_id,
            "shift_score": record.shift_score,
            "classification": record.shift_classification
        }
    )

    return record
