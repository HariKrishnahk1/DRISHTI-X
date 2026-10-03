import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal, init_db
from backend.app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from backend.app.models.user import User
from backend.app.models.dataset import Dataset, DatasetSample
from backend.app.models.model_entity import MLModel
from backend.app.models.inference import InferenceRecord
from backend.app.provenance.crypto_engine import (
    calculate_sha256_bytes,
    calculate_sha256_file,
    calculate_canonical_json_hash,
    sign_provenance_payload,
    verify_provenance_signature,
    generate_nonce
)
from backend.app.audit.audit_chain import record_audit_event, verify_audit_trail
from backend.app.assurance.risk_engine import aggregate_pipeline_risk
from backend.app.provenance.inference_engine import run_cryptographic_inference, verify_inference_record
from backend.app.ml.model_analyzer import generate_standard_battery
from backend.app.reports.report_generator import generate_assurance_report

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base

TEST_ENGINE = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=TEST_ENGINE)

# 1. Authentication & Security Tests
def test_password_hashing():
    pwd = "DefenceSecretPassword123!"
    h = get_password_hash(pwd)
    assert h != pwd
    assert verify_password(pwd, h) is True
    assert verify_password("WrongPassword", h) is False

def test_jwt_token_creation_and_decoding():
    token = create_access_token(subject="lead_analyst", role="ANALYST")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "lead_analyst"
    assert payload["role"] == "ANALYST"

# 2. Cryptographic Engine & Digital Signature Tests
def test_cryptographic_sha256():
    data = b"DEFENCE_MISSION_TARGET_ALPHA"
    digest = calculate_sha256_bytes(data)
    assert len(digest) == 64
    assert digest == calculate_sha256_bytes(data)

def test_canonical_json_hash():
    dict1 = {"b": 2, "a": 1, "nested": {"y": 20, "x": 10}}
    dict2 = {"a": 1, "nested": {"x": 10, "y": 20}, "b": 2}
    # Deterministic canonical serialization
    assert calculate_canonical_json_hash(dict1) == calculate_canonical_json_hash(dict2)

def test_ed25519_digital_signature():
    payload = {
        "input_hash": "a" * 64,
        "model_hash": "b" * 64,
        "config_hash": "c" * 64,
        "output_hash": "d" * 64,
        "timestamp": "2026-09-27T10:00:00Z",
        "nonce": generate_nonce(),
        "sequence": 1
    }
    sig_hex, alg, key_id = sign_provenance_payload(payload)
    assert alg == "Ed25519-SHA256"
    assert verify_provenance_signature(payload, sig_hex) is True

    # Tampered payload must fail
    tampered_payload = dict(payload)
    tampered_payload["output_hash"] = "e" * 64
    assert verify_provenance_signature(tampered_payload, sig_hex) is False

# 3. Tamper-Evident Audit Chain Tests
def test_audit_chain_integrity(db_session):
    record_audit_event(
        db=db_session,
        actor="UNIT_TESTER",
        role="DEFENCE",
        action="TEST_ACTION_A",
        details={"status": "INIT"}
    )
    record_audit_event(
        db=db_session,
        actor="UNIT_TESTER",
        role="DEFENCE",
        action="TEST_ACTION_B",
        details={"status": "FOLLOWUP"}
    )
    is_valid, msg, total, verified, comp_id = verify_audit_trail(db_session)
    assert is_valid is True
    assert "VALID" in msg
    assert comp_id is None

# 4. Model Reference Battery Tests
def test_reference_battery_generation():
    battery = generate_standard_battery()
    assert len(battery) == 8
    for item in battery:
        assert item.shape == (1, 3, 224, 224)

# 5. Risk Aggregation & Coverage Tests
def test_risk_aggregation(db_session):
    res = aggregate_pipeline_risk(db_session, asset_id="GLOBAL", asset_type="PIPELINE")
    assert "overall_risk_score" in res
    assert res["recommended_disposition"] in ["ACCEPT", "REVIEW", "QUARANTINE"]
    assert "coverage_matrix" in res
    assert res["coverage_matrix"]["dataset_integrity"]["status"] == "SUPPORTED"
    assert res["coverage_matrix"]["model_integrity"]["status"] == "SUPPORTED"
    assert res["coverage_matrix"]["inference_provenance"]["status"] == "SUPPORTED"
    assert res["coverage_matrix"]["zero_day_unmodeled_attacks"]["status"] == "NOT COVERED"
