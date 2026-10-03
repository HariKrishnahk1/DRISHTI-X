from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DistributionShiftRequest(BaseModel):
    baseline_id: str
    target_id: str

class DistributionShiftResponse(BaseModel):
    id: str
    baseline_id: str
    baseline_name: str
    target_id: str
    target_name: str
    shift_score: float
    shift_classification: str
    sensor_variance: float
    illumination_shift: float
    feature_divergence: float
    confidence: float
    affected_samples_count: Optional[int] = 0
    affected_samples: Optional[str] = None
    explanation: str
    method: str
    limitations: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AssuranceReportCreate(BaseModel):
    asset_id: str
    asset_type: str  # DATASET, MODEL, INFERENCE, PIPELINE
    analyst_notes: Optional[str] = None
    final_disposition: Optional[str] = None

class AssuranceReportResponse(BaseModel):
    id: str
    report_hash: str
    asset_id: str
    asset_type: str
    asset_name: str
    overall_risk_score: float
    risk_level: str
    confidence: float
    recommended_disposition: str
    final_disposition: str
    analyst_id: Optional[str] = None
    analyst_name: str
    analyst_notes: Optional[str] = None
    contributing_evidence_count: int
    coverage_matrix: Optional[str] = None
    unsupported_checks: Optional[str] = None
    limitations: Optional[str] = None
    full_report_data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DispositionUpdate(BaseModel):
    status: str  # ACCEPT, REVIEW, QUARANTINE
    reason: str
    analyst_notes: Optional[str] = None
