from enum import Enum
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token

class UserRole(str, Enum):
    CONTRIBUTOR = "CONTRIBUTOR"
    VENDOR = "VENDOR"
    ANALYST = "ANALYST"
    AUDITOR = "AUDITOR"
    DEFENCE = "DEFENCE"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def get_current_user(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    from backend.app.models.user import User
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

class RequireRoles:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user = Depends(get_current_user)):
        # DEFENCE role has super-admin/full operational visibility and capability
        if user.role == UserRole.DEFENCE.value:
            return user
        if user.role not in [r.value for r in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{user.role}'. Required: {[r.value for r in self.allowed_roles]}",
            )
        return user
