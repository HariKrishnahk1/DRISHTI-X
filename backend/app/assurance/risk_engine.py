import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.evidence import EvidenceItem
from backend.app.models.dataset import Dataset
from backend.app.models.model_entity import MLModel
from backend.app.models.inference import InferenceRecord
from backend.app.audit.audit_chain import verify_audit_trail

ASSURANCE_COVERAGE_MATRIX = {
    "dataset_integrity": {
        "status": "SUPPORTED",
        "description": "Perceptual hashing, label centroid divergence, PCA isolation forest OOD, corner patch trigger search."
    },
    "model_integrity": {
        "status": "SUPPORTED",
        "description": "Cryptographic SHA-256 verification, model substitution detection, reference battery behavioral fingerprinting."
    },
    "inference_provenance": {
        "status": "SUPPORTED",
        "description": "Ed25519 digital signature binding inputs, model, config, output, timestamp, nonce, sequence."
    },
    "distribution_shift": {
        "status": "SUPPORTED",
        "description": "Wasserstein metric & color-texture moments distinguishing operational drift from suspicious manipulation."
    },
    "audit_trail": {
        "status": "SUPPORTED",
        "description": "Cryptographically chained SHA-256 audit log with previous-hash verification."
    },
    "black_box_deep_weights": {
        "status": "LIMITED",
        "description": "Standardized input batteries used; direct weight reverse-engineering requires white-box access."
    },
    "adaptive_covert_backdoors": {
        "status": "LIMITED",
        "description": "Detects rigid and high-frequency perturbation patterns; imperceptible clean-label stealth triggers remain an active research challenge."
    },
    "zero_day_unmodeled_attacks": {
        "status": "NOT COVERED",
        "description": "Attacks outside defined statistical and cryptographic threat models require manual mission red-teaming."
    }
}

def aggregate_pipeline_risk(
    db: Session,
    asset_id: str,
    asset_type: str = "PIPELINE"
) -> Dict[str, Any]:
    """
    Central DRISHTI-X Assurance Engine.
    Aggregates multi-contributor data, model, inference, and audit signals into an explainable risk assessment.
    """
    # 1. Fetch relevant evidence items
    if asset_type == "PIPELINE":
        evidence_items = db.query(EvidenceItem).order_by(EvidenceItem.created_at.desc()).limit(30).all()
    else:
        evidence_items = db.query(EvidenceItem).filter(EvidenceItem.asset_id == asset_id).order_by(EvidenceItem.created_at.desc()).all()

    # 2. Check audit trail integrity
    audit_valid, audit_msg, total_events, verified_events, comp_id = verify_audit_trail(db)

    # 3. Base calculations and weights
    evidence_breakdown = []
    base_score = 5.0
    accumulated_score = base_score
    critical_count = 0
    high_count = 0
    medium_count = 0

    for item in evidence_items:
        impact = 0.0
        if item.severity == "CRITICAL":
            impact = 35.0
            critical_count += 1
        elif item.severity == "HIGH":
            impact = 20.0
            high_count += 1
        elif item.severity == "MEDIUM":
            impact = 10.0
            medium_count += 1
        else:
            impact = 3.0

        accumulated_score += impact * item.confidence
        evidence_breakdown.append({
            "evidence_id": item.id,
            "evidence_type": item.evidence_type,
            "severity": item.severity,
            "confidence": item.confidence,
            "description": item.description,
            "detection_method": item.detection_method,
            "impact_points": round(impact * item.confidence, 1)
        })

    # If audit trail is compromised, trigger critical alert
    if not audit_valid:
        accumulated_score += 45.0
        critical_count += 1
        evidence_breakdown.insert(0, {
            "evidence_id": "AUDIT-CRITICAL",
            "evidence_type": "AUDIT_CHAIN_COMPROMISED",
            "severity": "CRITICAL",
            "confidence": 1.0,
            "description": f"Audit trail linkage integrity violated at event {comp_id}. Potential unauthorized log tampering.",
            "detection_method": "SHA-256 Hash Chain Verification",
            "impact_points": 45.0
        })

    overall_score = round(min(100.0, max(0.0, accumulated_score)), 1)

    # Determine risk level and disposition
    if overall_score >= 70.0 or critical_count > 0:
        risk_level = "CRITICAL" if overall_score >= 85.0 or critical_count > 1 else "HIGH"
        recommended_disposition = "QUARANTINE"
        reason = f"{critical_count} critical and {high_count} high-severity integrity issues detected. Immediate quarantine required to protect mission operations."
    elif overall_score >= 30.0 or high_count > 0:
        risk_level = "MEDIUM"
        recommended_disposition = "REVIEW"
        reason = f"{medium_count + high_count} suspicious anomalies require analyst verification before deployment."
    else:
        risk_level = "LOW"
        recommended_disposition = "ACCEPT"
        reason = "All cryptographic checks, behavioral fingerprints, and distribution metrics within acceptable operational tolerance."

    mean_confidence = 0.92
    if evidence_items:
        mean_confidence = round(float(sum(e.confidence for e in evidence_items) / len(evidence_items)), 2)

    return {
        "asset_id": asset_id,
        "asset_type": asset_type,
        "overall_risk_score": overall_score,
        "risk_level": risk_level,
        "confidence": mean_confidence,
        "recommended_disposition": recommended_disposition,
        "disposition_reason": reason,
        "evidence_count": len(evidence_breakdown),
        "critical_issues_count": critical_count,
        "high_issues_count": high_count,
        "medium_issues_count": medium_count,
        "audit_chain_valid": audit_valid,
        "contributing_evidence": evidence_breakdown,
        "coverage_matrix": ASSURANCE_COVERAGE_MATRIX,
        "limitations": "Risk scoring aggregates statistical indicators and cryptographic assertions. It provides actionable assurance indicators rather than an infallible guarantee."
    }
