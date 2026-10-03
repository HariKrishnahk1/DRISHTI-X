from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class DatasetSampleResponse(BaseModel):
    id: str
    dataset_id: str
    filename: str
    file_path: str
    file_hash: str
    label: Optional[str] = None
    split: str
    is_suspicious: bool
    anomaly_type: str
    suspicion_score: float
    similarity_group: Optional[str] = None
    metadata_json: Optional[str] = None
    thumbnail_url: Optional[str] = None
    heatmap_url: Optional[str] = None

    class Config:
        from_attributes = True

class DatasetResponse(BaseModel):
    id: str
    name: str
    contributor_name: str
    contributor_id: Optional[str] = None
    version: str
    format: str
    num_images: int
    num_labels: int
    dataset_hash: str
    status: str
    risk_score: float
    risk_level: str
    analysis_summary: Optional[str] = None
    created_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DatasetDetailResponse(DatasetResponse):
    samples: List[DatasetSampleResponse] = []

class DatasetAnalysisResult(BaseModel):
    dataset_id: str
    dataset_hash: str
    total_samples: int
    suspicious_samples_count: int
    duplicate_clusters_count: int
    label_anomalies_count: int
    ood_samples_count: int
    trigger_candidates_count: int
    risk_score: float
    risk_level: str
    recommended_disposition: str
    coverage: dict
    limitations: str
    contributor_risk: dict
