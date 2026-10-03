from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditEventResponse(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    actor: str
    role: str
    action: str
    asset_id: Optional[str] = None
    details_json: Optional[str] = None
    previous_event_hash: str
    current_event_hash: str

    class Config:
        from_attributes = True

class AuditVerificationResult(BaseModel):
    is_valid: bool
    status: str  # AUDIT CHAIN VALID or AUDIT CHAIN COMPROMISED
    total_events: int
    verified_events: int
    compromised_event_id: Optional[str] = None
    details: str
