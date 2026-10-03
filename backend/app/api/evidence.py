from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rbac import get_current_user
from backend.app.models.user import User
from backend.app.models.evidence import EvidenceItem
from backend.app.schemas.evidence import EvidenceItemResponse

router = APIRouter(prefix="/evidence", tags=["Evidence"])

@router.get("", response_model=List[EvidenceItemResponse])
def list_evidence(
    severity: Optional[str] = None,
    asset_id: Optional[str] = None,
    evidence_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EvidenceItem)
    if severity:
        query = query.filter(EvidenceItem.severity == severity)
    if asset_id:
        query = query.filter(EvidenceItem.asset_id == asset_id)
    if evidence_type:
        query = query.filter(EvidenceItem.evidence_type == evidence_type)
    return query.order_by(EvidenceItem.created_at.desc()).all()

@router.get("/{id}", response_model=EvidenceItemResponse)
def get_evidence_item(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(EvidenceItem).filter(EvidenceItem.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return item
