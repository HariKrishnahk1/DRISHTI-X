from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.audit import AuditEvent
from backend.app.schemas.audit import AuditEventResponse, AuditVerificationResult
from backend.app.audit.audit_chain import verify_audit_trail, record_audit_event

router = APIRouter(prefix="/audit", tags=["Tamper-Evident Audit Trail"])

@router.get("", response_model=List[AuditEventResponse])
def list_audit_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(100).all()

@router.post("/verify", response_model=AuditVerificationResult)
def verify_audit_chain_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_valid, status_msg, total, verified, comp_id = verify_audit_trail(db)
    
    # We also log this verification event into the chain
    record_audit_event(
        db=db,
        actor=current_user.username,
        role=current_user.role,
        action="AUDIT_CHAIN_VERIFICATION",
        details={"status": status_msg, "verified_events": verified, "total": total}
    )

    return {
        "is_valid": is_valid,
        "status": status_msg,
        "total_events": total,
        "verified_events": verified,
        "compromised_event_id": comp_id,
        "details": f"Verified {verified} cryptographically linked audit blocks with SHA-256 state continuity."
    }

@router.post("/tamper-test")
def tamper_audit_event_for_test(
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE]))
):
    """Controlled test helper: Injects a byte alteration into an earlier audit event to prove cryptographic breakage."""
    first_event = db.query(AuditEvent).order_by(AuditEvent.id.asc()).first()
    if not first_event:
        raise HTTPException(status_code=400, detail="Audit chain is currently empty")

    first_event.action = "TAMPERED_ACTION_FOR_TEST"
    db.commit()
    db.refresh(first_event)
    return {"message": "Audit event tampered for test. Chain verification should now fail.", "event_id": first_event.event_id}
