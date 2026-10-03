import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.app.core.database import Base

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = Column(String, nullable=False, index=True)
    asset_type = Column(String, nullable=False)  # DATASET, MODEL, INFERENCE, PIPELINE
    evidence_type = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85)  # 0.0 - 1.0
    detection_method = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    observed_value = Column(Text, nullable=True)
    expected_value = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    related_samples = Column(Text, nullable=True)  # JSON list of sample paths/hashes
    related_model = Column(String, nullable=True)
    related_inference = Column(String, nullable=True)
    analyst_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
