"""
DRISHTI-X Demonstration / Research Test Scenario:
Tamper-Evident Audit Chain Cryptographic Verification
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal
from backend.app.audit.audit_chain import verify_audit_trail

def run_chain_verification():
    db = SessionLocal()
    print("[SCENARIO] Verifying DRISHTI-X cryptographic audit chain continuity...")
    is_valid, status_msg, total, verified, comp_id = verify_audit_trail(db)
    print(f"  Result:          {status_msg}")
    print(f"  Is Valid:        {is_valid}")
    print(f"  Total Events:    {total}")
    print(f"  Verified Events: {verified}")
    if comp_id:
        print(f"  Compromised ID:  {comp_id}")
    db.close()
    return is_valid

if __name__ == "__main__":
    run_chain_verification()
