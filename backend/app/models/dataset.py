import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    contributor_name = Column(String, nullable=False, index=True)
    contributor_id = Column(String, nullable=True)
    version = Column(String, default="1.0.0")
    format = Column(String, default="YOLO")  # YOLO, COCO
    num_images = Column(Integer, default=0)
    num_labels = Column(Integer, default=0)
    dataset_hash = Column(String, nullable=False, index=True)  # SHA-256
    storage_path = Column(String, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, ANALYZED, ACCEPTED, REVIEW, QUARANTINED
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    analysis_summary = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    analyzed_at = Column(DateTime, nullable=True)

    samples = relationship("DatasetSample", back_populates="dataset", cascade="all, delete-orphan")

class DatasetSample(Base):
    __tablename__ = "dataset_samples"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)  # SHA-256
    label = Column(String, nullable=True)
    split = Column(String, default="train")
    is_suspicious = Column(Boolean, default=False)
    anomaly_type = Column(String, default="CLEAN")  # CLEAN, TRIGGER_CANDIDATE, LABEL_ANOMALY, NEAR_DUPLICATE, OOD_ANOMALY
    suspicion_score = Column(Float, default=0.0)
    similarity_group = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="samples")
