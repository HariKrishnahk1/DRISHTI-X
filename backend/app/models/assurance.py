import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from backend.app.core.database import Base

class AssuranceReport(Base):
    __tablename__ = "assurance_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_hash = Column(String, nullable=False, index=True)  # Cryptographic SHA-256 of report contents
    asset_id = Column(String, nullable=False, index=True)
    asset_type = Column(String, nullable=False)  # DATASET, MODEL, INFERENCE, PIPELINE
    asset_name = Column(String, nullable=False)
    
    overall_risk_score = Column(Float, nullable=False)  # 0.0 - 100.0
    risk_level = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.90)
    
    recommended_disposition = Column(String, nullable=False)  # ACCEPT, REVIEW, QUARANTINE
    final_disposition = Column(String, default="REVIEW")
    
    analyst_id = Column(String, nullable=True)
    analyst_name = Column(String, default="Defence Assurance Officer")
    analyst_notes = Column(Text, nullable=True)
    
    contributing_evidence_count = Column(Integer, default=0)
    coverage_matrix = Column(Text, nullable=True)  # JSON
    unsupported_checks = Column(Text, nullable=True)  # JSON
    limitations = Column(Text, nullable=True)
    full_report_data = Column(Text, nullable=False)  # JSON complete data
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DistributionShiftRecord(Base):
    __tablename__ = "distribution_shift_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    baseline_id = Column(String, nullable=False)
    baseline_name = Column(String, nullable=False)
    target_id = Column(String, nullable=False)
    target_name = Column(String, nullable=False)
    
    shift_score = Column(Float, default=0.0)  # 0.0 - 100.0
    shift_classification = Column(String, default="OPERATIONAL_DRIFT")  # OPERATIONAL_DRIFT vs SUSPICIOUS_MANIPULATION
    
    sensor_variance = Column(Float, default=0.0)
    illumination_shift = Column(Float, default=0.0)
    terrain_distribution = Column(Text, nullable=True)  # JSON
    feature_divergence = Column(Float, default=0.0)
    confidence = Column(Float, default=0.88)
    
    affected_samples = Column(Text, nullable=True)  # JSON
    explanation = Column(Text, nullable=False)
    method = Column(String, default="PCA + Maximum Mean Discrepancy (MMD) & Perceptual Histograms")
    limitations = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def affected_samples_count(self) -> int:
        if not self.affected_samples:
            return 0
        try:
            items = json.loads(self.affected_samples)
            return len(items) if isinstance(items, list) else 0
        except Exception:
            return 0
