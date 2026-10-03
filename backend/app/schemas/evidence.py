from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EvidenceItemResponse(BaseModel):
    id: str
    asset_id: str
    asset_type: str
    evidence_type: str
    severity: str
    confidence: float
    detection_method: str
    description: str
    observed_value: Optional[str] = None
    expected_value: Optional[str] = None
    limitations: Optional[str] = None
    recommended_action: Optional[str] = None
    related_samples: Optional[str] = None
    related_model: Optional[str] = None
    related_inference: Optional[str] = None
    analyst_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
