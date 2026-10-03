"""
DRISHTI-X Demonstration / Research Test Scenario:
Create Cryptographic Provenance Inference Record
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.models.model_entity import MLModel
from backend.app.provenance.inference_engine import run_cryptographic_inference

def create_provenance_record():
    db = SessionLocal()
    model = db.query(MLModel).first()
    if not model:
        print("No models found in database.")
        db.close()
        return

    img_path = "data/demo/clean_surveillance/clean_sample_000.jpg"
    print(f"[SCENARIO] Executing inference with model {model.name}...")
    rec = run_cryptographic_inference(
        db=db,
        model_id=model.id,
        image_path=img_path,
        preprocessing_config={"normalize": True, "target_size": [224, 224]}
    )
    print(f"[SUCCESS] Inference Provenance Record Created:")
    print(f"  Record ID:       {rec.id}")
    print(f"  Input SHA-256:   {rec.input_hash}")
    print(f"  Model SHA-256:   {rec.model_hash}")
    print(f"  Output SHA-256:  {rec.output_hash}")
    print(f"  Nonce:           {rec.nonce}")
    print(f"  Sequence:        #{rec.sequence_number}")
    print(f"  Ed25519 Sig:     {rec.signature[:32]}...")
    db.close()
    return rec

if __name__ == "__main__":
    create_provenance_record()
