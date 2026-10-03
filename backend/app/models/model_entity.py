import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from backend.app.core.database import Base

class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    version = Column(String, default="1.0.0")
    format = Column(String, nullable=False)  # ONNX, PYTORCH, TORCHSCRIPT
    model_hash = Column(String, nullable=False, index=True)  # SHA-256
    expected_hash = Column(String, nullable=True)  # Trusted registered baseline SHA-256
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    architecture = Column(String, nullable=True)
    input_shape = Column(String, default="[1, 3, 224, 224]")
    access_level = Column(String, default="WHITE_BOX")  # WHITE_BOX, BLACK_BOX
    status = Column(String, default="REGISTERED")  # REGISTERED, ANALYZED, ACCEPTED, REVIEW, QUARANTINED
    is_substituted = Column(Boolean, default=False)
    substitution_details = Column(Text, nullable=True)
    baseline_fingerprint = Column(Text, nullable=True)  # JSON battery predictions
    current_fingerprint = Column(Text, nullable=True)
    fingerprint_deviation = Column(Float, default=0.0)
    trigger_search_results = Column(Text, nullable=True)  # Backdoor behavioral indicator test
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")
    contributor_name = Column(String, default="Defence Vendor")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    analyzed_at = Column(DateTime, nullable=True)
