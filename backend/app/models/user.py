import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="CONTRIBUTOR")
    organization = Column(String, nullable=False, default="Indian Army DGIS Unit")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
