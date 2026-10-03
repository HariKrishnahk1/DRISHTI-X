"""
DRISHTI-X Demonstration / Research Test Scenario:
Tamper with Inference Record & Demonstrate Cryptographic Detection
"""
import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.models.inference import InferenceRecord
from backend.app.provenance.inference_engine import verify_inference_record

def tamper_and_verify():
    db = SessionLocal()
    # Find latest verified inference record
    rec = db.query(InferenceRecord).filter(InferenceRecord.is_verified == True).order_by(InferenceRecord.sequence_number.desc()).first()
    if not rec:
        print("No verified inference record available to tamper.")
        db.close()
        return

    print(f"[SCENARIO] Tampering with output predictions of Record #{rec.sequence_number} ({rec.id})...")
    data = json.loads(rec.output_data)
    original_label = data.get("class_label")
    data["class_label"] = "CIVILIAN_BUS"  # Malicious manipulation
    data["confidence"] = 0.999
    rec.output_data = json.dumps(data)
    db.commit()

    print(f"  + Substituted target label '{original_label}' -> 'CIVILIAN_BUS'")
    print("[TEST] Running verification check on tampered record...")
    res = verify_inference_record(db, rec.id)
    print(f"  Status:       {res['status']}")
    print(f"  Tamper Found: {res['tamper_detected']}")
    print(f"  Failures:     {res['failure_reasons']}")
    print(f"  Disposition:  {res['disposition']}")
    db.close()

if __name__ == "__main__":
    tamper_and_verify()
