import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timezone
from backend.app.core.database import SessionLocal, init_db

from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.dataset import Dataset, DatasetSample
from backend.app.models.model_entity import MLModel
from backend.app.models.inference import InferenceRecord
from backend.app.services.dataset_service import ingest_dataset_archive
from backend.app.services.model_service import ingest_model_file
from backend.app.cv.data_integrity import analyze_dataset_integrity
from backend.app.ml.model_analyzer import analyze_model_integrity
from backend.app.provenance.inference_engine import run_cryptographic_inference, verify_inference_record
from backend.app.shift.shift_analyzer import analyze_distribution_shift
from backend.app.reports.report_generator import generate_assurance_report
from backend.app.audit.audit_chain import record_audit_event
from backend.app.provenance.crypto_engine import calculate_sha256_file

def seed_database():
    print("Initializing DRISHTI-X Database schema...")
    init_db()
    db = SessionLocal()

    # 1. Seed Users
    users_data = [
        {"username": "defence_commander", "email": "commander@army.dgis.mil.in", "role": "DEFENCE", "org": "Indian Army / DGIS HQ"},
        {"username": "lead_analyst", "email": "analyst@army.dgis.mil.in", "role": "ANALYST", "org": "Defence AI Assurance Wing"},
        {"username": "bharat_vendor", "email": "vendor@bharatdefence.in", "role": "VENDOR", "org": "Bharat Defence Systems Ltd"},
        {"username": "field_contributor", "email": "recon@army.dgis.mil.in", "role": "CONTRIBUTOR", "org": "Northern Command Recon Unit"},
        {"username": "cag_auditor", "email": "auditor@cag.gov.in", "role": "AUDITOR", "org": "Defence Audit Directorate"},
    ]

    for u in users_data:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash("Password123!"),
                role=u["role"],
                organization=u["org"],
                is_active=True
            )
            db.add(user)
    db.commit()
    print("Seed users created (password: Password123!).")

    # Initial audit genesis
    record_audit_event(
        db=db,
        actor="SYSTEM_INITIALIZER",
        role="DEFENCE",
        action="SYSTEM_INITIALIZATION",
        details={"version": "1.0.0", "status": "AIR_GAPPED_OPERATIONAL"}
    )

    # 2. Ingest Datasets
    print("Ingesting demonstration datasets...")
    demo_base = os.path.join("data", "demo")
    
    clean_ds = ingest_dataset_archive(
        db=db,
        archive_path=os.path.join(demo_base, "clean_surveillance"),
        name="SURVEILLANCE_EO_CLEAN_V1",
        contributor_name="field_contributor",
        version="1.0.0",
        dataset_format="YOLO",
        actor="field_contributor",
        role="CONTRIBUTOR"
    )

    dup_ds = ingest_dataset_archive(
        db=db,
        archive_path=os.path.join(demo_base, "duplicate_flooded"),
        name="RADAR_EO_DUPLICATE_FLOODED",
        contributor_name="field_contributor",
        version="1.0.0",
        dataset_format="YOLO",
        actor="field_contributor",
        role="CONTRIBUTOR"
    )

    trigger_ds = ingest_dataset_archive(
        db=db,
        archive_path=os.path.join(demo_base, "backdoor_trigger_contaminated"),
        name="TACTICAL_ARMOR_TRIGGER_ANOMALY",
        contributor_name="untrusted_third_party",
        version="1.0.0",
        dataset_format="YOLO",
        actor="field_contributor",
        role="CONTRIBUTOR"
    )

    snow_ds = ingest_dataset_archive(
        db=db,
        archive_path=os.path.join(demo_base, "high_altitude_snow_drift"),
        name="HIGH_ALTITUDE_SNOW_DRIFT",
        contributor_name="northern_corps",
        version="1.0.0",
        dataset_format="YOLO",
        actor="field_contributor",
        role="CONTRIBUTOR"
    )

    # 3. Analyze Datasets
    print("Executing dataset integrity analysis...")
    analyze_dataset_integrity(db, clean_ds.id)
    analyze_dataset_integrity(db, dup_ds.id)
    analyze_dataset_integrity(db, trigger_ds.id)
    analyze_dataset_integrity(db, snow_ds.id)

    # 4. Ingest Models
    print("Ingesting and registering models...")
    onnx_path = os.path.join("models", "demo", "defence_vision_classifier_v1.onnx")
    pt_path = os.path.join("models", "demo", "defence_tactical_detector.pt")
    
    onnx_hash = calculate_sha256_file(onnx_path) if os.path.exists(onnx_path) else "0"*64

    # Model A: Certified Baseline
    model_a = ingest_model_file(
        db=db,
        uploaded_file_path=onnx_path,
        name="DEFENCE_VISION_CLASSIFIER_CERTIFIED",
        version="1.0.0",
        format_type="ONNX",
        expected_hash=onnx_hash,  # Matches!
        access_level="WHITE_BOX",
        contributor_name="Bharat Defence Systems Ltd",
        actor="bharat_vendor",
        role="VENDOR"
    )

    # Model B: Substituted Model (Expected Hash mismatch scenario)
    model_b = ingest_model_file(
        db=db,
        uploaded_file_path=onnx_path,
        name="SUSPECT_SURVEILLANCE_BACKBONE",
        version="2.1.0",
        format_type="ONNX",
        expected_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  # Purposely mismatched!
        access_level="WHITE_BOX",
        contributor_name="Foreign Vendor Subcontractor",
        actor="bharat_vendor",
        role="VENDOR"
    )

    # Model C: PyTorch TorchScript
    model_c = ingest_model_file(
        db=db,
        uploaded_file_path=pt_path,
        name="DEFENCE_TACTICAL_TORCHSCRIPT_DETECTOR",
        version="1.0.0",
        format_type="PYTORCH",
        expected_hash=calculate_sha256_file(pt_path) if os.path.exists(pt_path) else None,
        access_level="WHITE_BOX",
        contributor_name="Defence DRDO Vision Lab",
        actor="lead_analyst",
        role="ANALYST"
    )

    # Analyze models
    print("Executing model integrity analysis...")
    analyze_model_integrity(db, model_a.id)
    analyze_model_integrity(db, model_b.id)
    analyze_model_integrity(db, model_c.id)

    # 5. Cryptographic Inferences
    print("Generating cryptographic inference records...")
    sample_img = os.path.join("data", "demo", "clean_surveillance", "clean_sample_000.jpg")
    inf1 = run_cryptographic_inference(
        db=db,
        model_id=model_a.id,
        image_path=sample_img,
        preprocessing_config={"normalize": True, "target_size": [224, 224]}
    )
    verify_inference_record(db, inf1.id)

    inf2 = run_cryptographic_inference(
        db=db,
        model_id=model_a.id,
        image_path=sample_img,
        preprocessing_config={"normalize": True, "target_size": [224, 224]}
    )
    # Simulate tampering on inf2
    import json
    inf2_out = json.loads(inf2.output_data)
    inf2_out["class_label"] = "CIVILIAN_CAR"
    inf2_out["confidence"] = 0.999
    inf2.output_data = json.dumps(inf2_out)
    db.commit()
    verify_inference_record(db, inf2.id)

    # 6. Distribution Shift Analysis
    print("Executing distribution shift analysis...")
    analyze_distribution_shift(db, baseline_id=clean_ds.id, target_id=snow_ds.id)
    analyze_distribution_shift(db, baseline_id=clean_ds.id, target_id=trigger_ds.id)

    # 7. Generate Baseline Assurance Report
    print("Generating initial assurance reports...")
    generate_assurance_report(
        db=db,
        asset_id=trigger_ds.id,
        asset_type="DATASET",
        analyst_name="lead_analyst",
        analyst_notes="Automated trigger pattern and label anomaly flags confirmed. Immediate quarantine recommended.",
        final_disposition="QUARANTINE"
    )

    generate_assurance_report(
        db=db,
        asset_id=model_b.id,
        asset_type="MODEL",
        analyst_name="lead_analyst",
        analyst_notes="Model substitution detected via cryptographic SHA-256 digest divergence against registered vendor spec.",
        final_disposition="QUARANTINE"
    )

    db.close()
    print("DRISHTI-X seed initialization completed successfully!")

if __name__ == "__main__":
    seed_database()
