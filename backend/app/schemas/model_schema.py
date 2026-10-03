from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class MLModelBase(BaseModel):
    name: str
    version: str
    format: str
    expected_hash: Optional[str] = None
    access_level: str = "WHITE_BOX"
    contributor_name: str = "Defence Vendor"

class MLModelResponse(BaseModel):
    id: str
    name: str
    version: str
    format: str
    model_hash: str
    expected_hash: Optional[str] = None
    file_size_bytes: int
    architecture: Optional[str] = None
    input_shape: str
    access_level: str
    status: str
    is_substituted: bool
    substitution_details: Optional[str] = None
    baseline_fingerprint: Optional[str] = None
    current_fingerprint: Optional[str] = None
    trigger_search_results: Optional[str] = None
    fingerprint_deviation: float
    risk_score: float
    risk_level: str
    contributor_name: str
    created_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModelAnalysisResult(BaseModel):
    model_id: str
    model_name: str
    model_hash: str
    expected_hash: Optional[str] = None
    is_substituted: bool
    substitution_severity: str
    fingerprint_deviation: float
    trigger_indicators: Dict[str, Any]
    access_level: str
    risk_score: float
    risk_level: str
    recommended_disposition: str
    coverage: Dict[str, str]
    limitations: str
