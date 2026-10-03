import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditEvent

GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_event_hash(
    event_id: str,
    timestamp_iso: str,
    actor: str,
    role: str,
    action: str,
    asset_id: Optional[str],
    details_str: Optional[str],
    previous_hash: str
) -> str:
    payload = f"{event_id}|{timestamp_iso}|{actor}|{role}|{action}|{asset_id or ''}|{details_str or ''}|{previous_hash}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def record_audit_event(
    db: Session,
    actor: str,
    role: str,
    action: str,
    asset_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditEvent:
    # Find last event in chain
    last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_event.current_event_hash if last_event else GENESIS_PREVIOUS_HASH
    
    now = datetime.now(timezone.utc)
    timestamp_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    import uuid
    event_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"
    details_str = json.dumps(details or {}, sort_keys=True)
    
    current_hash = compute_event_hash(
        event_id=event_id,
        timestamp_iso=timestamp_iso,
        actor=actor,
        role=role,
        action=action,
        asset_id=asset_id,
        details_str=details_str,
        previous_hash=prev_hash
    )
    
    new_event = AuditEvent(
        event_id=event_id,
        timestamp=now,
        timestamp_str=timestamp_iso,
        actor=actor,
        role=role,
        action=action,
        asset_id=asset_id,
        details_json=details_str,
        previous_event_hash=prev_hash,
        current_event_hash=current_hash
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

def verify_audit_trail(db: Session) -> Tuple[bool, str, int, int, Optional[str]]:
    """
    Verifies the entire cryptographic hash chain.
    Returns: (is_valid, status_msg, total_events, verified_events, compromised_event_id)
    """
    events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
    if not events:
        return True, "AUDIT CHAIN VALID (Empty chain initialized)", 0, 0, None

    expected_prev = GENESIS_PREVIOUS_HASH
    verified_count = 0
    
    for event in events:
        # Check linkage to previous event
        if event.previous_event_hash != expected_prev:
            return False, f"AUDIT CHAIN COMPROMISED: Linkage mismatch at event {event.event_id}", len(events), verified_count, event.event_id
        
        # Re-compute current hash using immutable stored timestamp_str
        ts_str = getattr(event, "timestamp_str", None) or event.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        recomputed = compute_event_hash(
            event_id=event.event_id,
            timestamp_iso=ts_str,
            actor=event.actor,
            role=event.role,
            action=event.action,
            asset_id=event.asset_id,
            details_str=event.details_json,
            previous_hash=expected_prev
        )
        if recomputed != event.current_event_hash:
            return False, f"AUDIT CHAIN COMPROMISED: Tampered event content at {event.event_id}", len(events), verified_count, event.event_id
        
        expected_prev = event.current_event_hash
        verified_count += 1

        
    return True, "AUDIT CHAIN VALID", len(events), verified_count, None
