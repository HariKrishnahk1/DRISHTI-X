import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text
from backend.app.core.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, unique=True, index=True, default=lambda: f"EVT-{uuid.uuid4().hex[:12].upper()}")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    timestamp_str = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False, index=True)
    asset_id = Column(String, nullable=True, index=True)
    details_json = Column(Text, nullable=True)
    previous_event_hash = Column(String, nullable=False)
    current_event_hash = Column(String, nullable=False, index=True)
