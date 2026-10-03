"""
DRISHTI-X Demonstration / Research Test Scenario:
Simulate Replay Attack on Inference Provenance
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.models.inference import InferenceRecord
from backend.app.provenance.inference_engine import verify_inference_record

def replay_and_detect():
    db = SessionLocal()
    rec = db.query(InferenceRecord).first()
    if not rec:
        print("No inference record found.")
        db.close()
        return

    print(f"[SCENARIO] Simulating replay injection of Nonce {rec.nonce}...")
    rec.is_replayed = True
    db.commit()

    res = verify_inference_record(db, rec.id)
    print(f"  Status:       {res['status']}")
    print(f"  Tamper Found: {res['tamper_detected']}")
    print(f"  Failures:     {res['failure_reasons']}")
    db.close()

if __name__ == "__main__":
    replay_and_detect()
