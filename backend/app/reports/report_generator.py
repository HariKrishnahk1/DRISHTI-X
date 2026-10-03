import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.assurance import AssuranceReport
from backend.app.models.dataset import Dataset
from backend.app.models.model_entity import MLModel
from backend.app.models.inference import InferenceRecord
from backend.app.models.evidence import EvidenceItem
from backend.app.assurance.risk_engine import aggregate_pipeline_risk, ASSURANCE_COVERAGE_MATRIX
from backend.app.provenance.crypto_engine import calculate_canonical_json_hash
from backend.app.audit.audit_chain import record_audit_event

def generate_assurance_report(
    db: Session,
    asset_id: str,
    asset_type: str,
    analyst_name: str = "Defence Assurance Officer",
    analyst_id: Optional[str] = None,
    analyst_notes: Optional[str] = None,
    final_disposition: Optional[str] = None
) -> AssuranceReport:
    # 1. Lookup asset name
    asset_name = f"{asset_type}-{asset_id[:8]}"
    if asset_type == "DATASET":
        ds = db.query(Dataset).filter(Dataset.id == asset_id).first()
        if ds:
            asset_name = ds.name
    elif asset_type == "MODEL":
        m = db.query(MLModel).filter(MLModel.id == asset_id).first()
        if m:
            asset_name = m.name
    elif asset_type == "INFERENCE":
        inf = db.query(InferenceRecord).filter(InferenceRecord.id == asset_id).first()
        if inf:
            asset_name = f"Inference Seq #{inf.sequence_number} ({inf.model_name})"

    # 2. Aggregate risk
    risk_summary = aggregate_pipeline_risk(db, asset_id=asset_id, asset_type=asset_type)
    rec_disp = risk_summary["recommended_disposition"]
    disp = final_disposition or rec_disp

    now = datetime.now(timezone.utc)
    report_data = {
        "title": "DRISHTI-X ASSURANCE REPORT",
        "platform": settings.FULL_TITLE,
        "problem_statement_id": settings.PROBLEM_STATEMENT_ID,
        "department": settings.DEPARTMENT,
        "classification": "CONFIDENTIAL / DEFENCE OPERATIONS",
        "generated_at": now.isoformat(),
        "asset": {
            "id": asset_id,
            "type": asset_type,
            "name": asset_name,
        },
        "risk_assessment": {
            "overall_risk_score": risk_summary["overall_risk_score"],
            "risk_level": risk_summary["risk_level"],
            "confidence": risk_summary["confidence"],
            "recommended_disposition": rec_disp,
            "final_disposition": disp,
            "reason": risk_summary["disposition_reason"]
        },
        "analyst_governance": {
            "analyst_id": analyst_id,
            "analyst_name": analyst_name,
            "analyst_notes": analyst_notes or "Standard automated pipeline assurance review."
        },
        "contributing_evidence": risk_summary["contributing_evidence"],
        "assurance_coverage": ASSURANCE_COVERAGE_MATRIX,
        "limitations": [
            "Assurance scores represent cryptographic verification and statistical indicators on ingested data/models.",
            "Detector does not guarantee zero false-negatives against novel or targeted adaptive clean-label perturbations.",
            "Analyst verification is mandatory prior to lifting quarantine status on high-risk assets."
        ],
        "audit_verification": {
            "audit_chain_valid": risk_summary["audit_chain_valid"]
        }
    }

    # 3. Compute Cryptographic SHA-256 Digest of Report
    report_hash = calculate_canonical_json_hash(report_data)
    report_data["report_hash"] = report_hash

    # 4. Save file to disk
    report_filename = f"report_{asset_type.lower()}_{asset_id[:8]}_{report_hash[:8]}.json"
    report_filepath = os.path.join(settings.REPORTS_DIR, report_filename)
    with open(report_filepath, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    # 5. Persist to DB
    new_report = AssuranceReport(
        report_hash=report_hash,
        asset_id=asset_id,
        asset_type=asset_type,
        asset_name=asset_name,
        overall_risk_score=risk_summary["overall_risk_score"],
        risk_level=risk_summary["risk_level"],
        confidence=risk_summary["confidence"],
        recommended_disposition=rec_disp,
        final_disposition=disp,
        analyst_id=analyst_id,
        analyst_name=analyst_name,
        analyst_notes=analyst_notes,
        contributing_evidence_count=len(risk_summary["contributing_evidence"]),
        coverage_matrix=json.dumps(ASSURANCE_COVERAGE_MATRIX),
        unsupported_checks=json.dumps(["zero_day_unmodeled_attacks"]),
        limitations="Assurance coverage explicitly bounded to statistical anomalies and cryptographic bindings.",
        full_report_data=json.dumps(report_data),
        created_at=now
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Record in audit trail
    record_audit_event(
        db=db,
        actor=analyst_name,
        role="ANALYST",
        action="REPORT_GENERATED",
        asset_id=new_report.id,
        details={
            "report_hash": report_hash,
            "asset_id": asset_id,
            "disposition": disp,
            "risk_score": risk_summary["overall_risk_score"]
        }
    )

    return new_report
