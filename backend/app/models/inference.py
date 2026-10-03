import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from backend.app.core.database import Base

class InferenceRecord(Base):
    __tablename__ = "inference_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False, index=True)
    model_name = Column(String, nullable=False)
    model_hash = Column(String, nullable=False)  # Bound Model SHA-256
    
    input_image_path = Column(String, nullable=False)
    input_hash = Column(String, nullable=False)  # Bound Input Image SHA-256
    
    preprocessing_config = Column(Text, nullable=False)  # JSON config
    config_hash = Column(String, nullable=False)  # SHA-256 of preprocessing config
    
    output_data = Column(Text, nullable=False)  # Predictions JSON (classes, scores, boxes)
    output_hash = Column(String, nullable=False)  # Bound Output SHA-256
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    nonce = Column(String, nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False, index=True)
    
    # Cryptographic binding
    signature = Column(String, nullable=False)  # Hex/base64 encoded Ed25519/HMAC signature
    signature_algorithm = Column(String, default="Ed25519-SHA256")
    public_key_id = Column(String, default="DRISHTI-X-EDGE-KEY-001")
    
    # Verification & Replay tracking
    is_verified = Column(Boolean, default=True)
    verification_status = Column(String, default="VERIFIED")  # VERIFIED, INTEGRITY_FAILURE, REPLAY_DETECTED
    verification_details = Column(Text, nullable=True)
    is_replayed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
