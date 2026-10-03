import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.rbac import get_current_user, RequireRoles, UserRole
from backend.app.models.user import User
from backend.app.models.assurance import AssuranceReport
from backend.app.schemas.assurance import AssuranceReportCreate, AssuranceReportResponse
from backend.app.reports.report_generator import generate_assurance_report
from backend.app.provenance.crypto_engine import calculate_canonical_json_hash

router = APIRouter(prefix="/reports", tags=["Assurance Reports"])

@router.get("", response_model=List[AssuranceReportResponse])
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AssuranceReport).order_by(AssuranceReport.created_at.desc()).all()

@router.post("/generate", response_model=AssuranceReportResponse)
def create_report(
    payload: AssuranceReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles([UserRole.ANALYST, UserRole.DEFENCE, UserRole.AUDITOR]))
):
    try:
        report = generate_assurance_report(
            db=db,
            asset_id=payload.asset_id,
            asset_type=payload.asset_type,
            analyst_name=current_user.username,
            analyst_id=current_user.id,
            analyst_notes=payload.analyst_notes,
            final_disposition=payload.final_disposition
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=AssuranceReportResponse)
def get_report(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(AssuranceReport).filter(AssuranceReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Assurance report not found")
    return report

@router.get("/{id}/download")
def download_report(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(AssuranceReport).filter(AssuranceReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Assurance report not found")
    
    headers = {
        'Content-Disposition': f'attachment; filename="drishti_assurance_report_{report.id[:8]}.json"'
    }
    return Response(content=report.full_report_data, media_type="application/json", headers=headers)

@router.post("/{id}/verify-hash")
def verify_report_hash(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(AssuranceReport).filter(AssuranceReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Assurance report not found")

    data = json.loads(report.full_report_data)
    # Remove report_hash field to recompute canonical content digest
    recorded_hash = data.pop("report_hash", report.report_hash)
    recalculated = calculate_canonical_json_hash(data)

    is_valid = (recorded_hash == recalculated)
    return {
        "report_id": report.id,
        "is_valid": is_valid,
        "recorded_hash": recorded_hash,
        "recalculated_hash": recalculated,
        "status": "REPORT INTEGRITY VERIFIED" if is_valid else "REPORT HASH MISMATCH"
    }
