from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class InferenceRunRequest(BaseModel):
    model_id: str
    preprocessing_config: Optional[Dict[str, Any]] = None

class InferenceRecordResponse(BaseModel):
    id: str
    model_id: str
    model_name: str
    model_hash: str
    input_image_path: str
    input_hash: str
    preprocessing_config: str
    config_hash: str
    output_data: str
    output_hash: str
    timestamp: datetime
    nonce: str
    sequence_number: int
    signature: str
    signature_algorithm: str
    public_key_id: str
    is_verified: bool
    verification_status: str
    verification_details: Optional[str] = None
    is_replayed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InferenceVerificationResult(BaseModel):
    inference_id: str
    is_valid: bool
    status: str  # VERIFIED, INTEGRITY_FAILURE, REPLAY_DETECTED
    checks: Dict[str, Any]
    tamper_detected: bool
    failure_reasons: list[str] = []
    disposition: str
    severity: str
