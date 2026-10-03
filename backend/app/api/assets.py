from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.dataset import Dataset
from backend.app.models.model_entity import MLModel
from backend.app.schemas.assurance import DispositionUpdate
from backend.app.audit.audit_chain import record_audit_event

router = APIRouter(prefix="/assets", tags=["Analyst Governance & Disposition"])

def _update_asset_disposition(db: Session, asset_id: str, new_status: str, reason: str, notes: str, user: User):
    # Try finding in Datasets
    ds = db.query(Dataset).filter(Dataset.id == asset_id).first()
    if ds:
        ds.status = new_status
        db.commit()
        db.refresh(ds)
        record_audit_event(
            db=db,
            actor=user.username,
            role=user.role,
            action=f"DATASET_DISPOSITION_{new_status}",
            asset_id=asset_id,
            details={"new_status": new_status, "reason": reason, "analyst_notes": notes}
        )
        return {"asset_id": asset_id, "type": "DATASET", "status": new_status, "reason": reason}

    # Try finding in Models
    model = db.query(MLModel).filter(MLModel.id == asset_id).first()
    if model:
        model.status = new_status
        db.commit()
        db.refresh(model)
        record_audit_event(
            db=db,
            actor=user.username,
            role=user.role,
            action=f"MODEL_DISPOSITION_{new_status}",
            asset_id=asset_id,
            details={"new_status": new_status, "reason": reason, "analyst_notes": notes}
        )
        return {"asset_id": asset_id, "type": "MODEL", "status": new_status, "reason": reason}

    raise HTTPException(status_code=404, detail="Asset (Dataset or Model) not found")

@router.post("/{id}/accept")
def accept_asset(
    id: str,
    update: DispositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    return _update_asset_disposition(db, id, "ACCEPTED", update.reason, update.analyst_notes or "", current_user)

@router.post("/{id}/review")
def review_asset(
    id: str,
    update: DispositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    return _update_asset_disposition(db, id, "REVIEW", update.reason, update.analyst_notes or "", current_user)

@router.post("/{id}/quarantine")
def quarantine_asset(
    id: str,
    update: DispositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    if not update.reason:
        raise HTTPException(status_code=400, detail="Quarantine action strictly requires an explicit justification reason.")
    return _update_asset_disposition(db, id, "QUARANTINED", update.reason, update.analyst_notes or "", current_user)
