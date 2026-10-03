from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.core.database import get_db
from backend.app.models.dataset import Dataset
from backend.app.models.model_entity import MLModel
from backend.app.models.inference import InferenceRecord
from backend.app.cv.data_integrity import analyze_dataset_integrity
from backend.app.ml.model_analyzer import analyze_model_integrity
from backend.app.provenance.inference_engine import run_cryptographic_inference, verify_inference_record
from backend.app.shift.shift_analyzer import analyze_distribution_shift

router = APIRouter(prefix="/demo", tags=["Demo Management & Scenarios"])

SCENARIOS_META = [
    {
        "id": "scenario_backdoor",
        "title": "Scenario 1: Trojan Backdoor Trigger Injection",
        "category": "TRAINING_DATA",
        "severity": "CRITICAL",
        "threat_description": "Adversary injects identical 16x16 high-frequency corner trigger stamps across target images to force model misclassification during tactical deployment.",
        "expected_action": "Perimeter trigger detector isolates identical frequency patterns, flags candidate Trojan, and recommends immediate QUARANTINE."
    },
    {
        "id": "scenario_substitution",
        "title": "Scenario 2: Model Substitution / Supply-Chain Tampering",
        "category": "MODEL_INTEGRITY",
        "severity": "CRITICAL",
        "threat_description": "An untrusted subcontractor delivers a modified model binary whose SHA-256 hash diverges from the certified Army baseline specification.",
        "expected_action": "Cryptographic digest comparison flags MODEL SUBSTITUTION / VERSION MISMATCH with 100% confidence and forces QUARANTINE."
    },
    {
        "id": "scenario_tamper",
        "title": "Scenario 3: In-Transit Inference Output Manipulation",
        "category": "INFERENCE_PROVENANCE",
        "severity": "HIGH",
        "threat_description": "A man-in-the-middle adversary alters the battlefield classification output from ARMORED_VEHICLE to CIVILIAN_VEHICLE without knowledge of the private key.",
        "expected_action": "Canonical JSON digest and Ed25519 digital signature verification fail immediately, tagging INTEGRITY_FAILURE."
    },
    {
        "id": "scenario_replay",
        "title": "Scenario 4: Cryptographic Replay / Sequence Spoofing",
        "category": "INFERENCE_PROVENANCE",
        "severity": "HIGH",
        "threat_description": "Adversary re-transmits a captured valid reconnaissance packet to deceive command systems regarding active battlefield targets.",
        "expected_action": "Replay guard catches nonce reuse and duplicate sequence counters, flagging REPLAY_DETECTED."
    },
    {
        "id": "scenario_shift",
        "title": "Scenario 5: High-Altitude Terrain & Environmental Drift",
        "category": "DISTRIBUTION_SHIFT",
        "severity": "MEDIUM",
        "threat_description": "Reconnaissance model trained on arid/plains imagery is deployed to high-altitude winter snow conditions.",
        "expected_action": "Wasserstein metric calculates feature divergence and correctly classifies as OPERATIONAL_DRIFT rather than malicious manipulation."
    }
]

@router.get("/scenarios", response_model=List[Dict[str, Any]])
def list_demo_scenarios():
    return SCENARIOS_META

@router.post("/scenarios/{scenario_id}/run")
def execute_demo_scenario(scenario_id: str, db: Session = Depends(get_db)):
    if scenario_id == "scenario_backdoor":
        ds = db.query(Dataset).filter(Dataset.name.ilike("%TRIGGER%")).first()
        if not ds:
            ds = db.query(Dataset).first()
        if not ds:
            raise HTTPException(status_code=400, detail="No dataset available. Please seed demo first.")
        result = analyze_dataset_integrity(db, ds.id)
        return {
            "scenario": "Trojan Backdoor Trigger Injection",
            "asset_id": ds.id,
            "asset_name": ds.name,
            "status": "DETECTED",
            "findings": f"Identified {result['trigger_candidates_count']} trigger pattern candidates and {result['label_anomalies_count']} label anomalies.",
            "recommended_disposition": result["recommended_disposition"],
            "risk_score": result["risk_score"]
        }

    elif scenario_id == "scenario_substitution":
        m = db.query(MLModel).filter(MLModel.name.ilike("%SUSPECT%")).first()
        if not m:
            m = db.query(MLModel).first()
        if not m:
            raise HTTPException(status_code=400, detail="No model available.")
        result = analyze_model_integrity(db, m.id)
        return {
            "scenario": "Model Substitution / Supply-Chain Tampering",
            "asset_id": m.id,
            "asset_name": m.name,
            "status": "MISMATCH_DETECTED" if result["is_substituted"] else "VERIFIED",
            "expected_hash": result["expected_hash"],
            "observed_hash": result["model_hash"],
            "recommended_disposition": result["recommended_disposition"],
            "risk_score": result["risk_score"]
        }

    elif scenario_id == "scenario_tamper":
        rec = db.query(InferenceRecord).first()
        if not rec:
            raise HTTPException(status_code=400, detail="No inference record available.")
        import json
        out_dict = json.loads(rec.output_data)
        out_dict["class_label"] = "CIVILIAN_VEHICLE"
        out_dict["confidence"] = 0.999
        rec.output_data = json.dumps(out_dict)
        db.commit()
        verify_res = verify_inference_record(db, rec.id)
        return {
            "scenario": "In-Transit Inference Manipulation",
            "inference_id": rec.id,
            "sequence": rec.sequence_number,
            "tamper_detected": verify_res["tamper_detected"],
            "status": verify_res["status"],
            "failure_reasons": verify_res["failure_reasons"]
        }

    elif scenario_id == "scenario_replay":
        rec = db.query(InferenceRecord).first()
        if not rec:
            raise HTTPException(status_code=400, detail="No inference record available.")
        rec.is_replayed = True
        db.commit()
        verify_res = verify_inference_record(db, rec.id)
        return {
            "scenario": "Signal Replay Attack",
            "inference_id": rec.id,
            "replayed_nonce": rec.nonce,
            "status": verify_res["status"],
            "failure_reasons": verify_res["failure_reasons"]
        }

    elif scenario_id == "scenario_shift":
        clean_ds = db.query(Dataset).filter(Dataset.name.ilike("%CLEAN%")).first()
        snow_ds = db.query(Dataset).filter(Dataset.name.ilike("%SNOW%")).first()
        if not clean_ds or not snow_ds:
            raise HTTPException(status_code=400, detail="Clean and snow datasets required.")
        shift_res = analyze_distribution_shift(db, clean_ds.id, snow_ds.id)
        return {
            "scenario": "High-Altitude Terrain & Environmental Drift",
            "baseline": clean_ds.name,
            "target": snow_ds.name,
            "shift_score": shift_res.shift_score,
            "classification": shift_res.shift_classification,
            "explanation": shift_res.explanation
        }

    raise HTTPException(status_code=404, detail="Unknown scenario ID")

@router.post("/seed")
def trigger_seed(db: Session = Depends(get_db)):
    try:
        from scripts.seed_demo import seed_database
        seed_database()
        return {"status": "SUCCESS", "message": "DRISHTI-X demo environment successfully seeded."}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}
