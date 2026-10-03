import os
import shutil
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.model_entity import MLModel
from backend.app.provenance.crypto_engine import calculate_sha256_file
from backend.app.ml.model_analyzer import get_adapter_for_model
from backend.app.audit.audit_chain import record_audit_event

def ingest_model_file(
    db: Session,
    uploaded_file_path: str,
    name: str,
    version: str,
    format_type: str,
    expected_hash: Optional[str] = None,
    access_level: str = "WHITE_BOX",
    contributor_name: str = "Defence Vendor",
    actor: str = "Vendor",
    role: str = "VENDOR"
) -> MLModel:
    model_hash = calculate_sha256_file(uploaded_file_path)
    file_size = os.path.getsize(uploaded_file_path)
    
    # Store in models directory
    dest_filename = f"{name.lower().replace(' ', '_')}_{version}_{model_hash[:8]}.{format_type.lower()}"
    dest_path = os.path.join(settings.MODELS_DIR, dest_filename)
    shutil.copy2(uploaded_file_path, dest_path)

    # Initial adapter check for architecture & input shape
    temp_model = MLModel(
        name=name,
        version=version,
        format=format_type.upper(),
        model_hash=model_hash,
        expected_hash=expected_hash,
        file_path=dest_path,
        file_size_bytes=file_size,
        access_level=access_level,
        status="REGISTERED",
        contributor_name=contributor_name,
        created_at=datetime.now(timezone.utc)
    )
    
    adapter = get_adapter_for_model(temp_model)
    if adapter.load():
        meta = adapter.get_metadata()
        temp_model.architecture = meta.get("architecture") or meta.get("producer_name", "CV Backbone")
        temp_model.input_shape = str(meta.get("input_shape", "[1, 3, 224, 224]"))

    db.add(temp_model)
    db.commit()
    db.refresh(temp_model)

    # Audit event
    record_audit_event(
        db=db,
        actor=actor,
        role=role,
        action="MODEL_UPLOAD",
        asset_id=temp_model.id,
        details={
            "model_name": temp_model.name,
            "version": temp_model.version,
            "format": temp_model.format,
            "model_hash": temp_model.model_hash,
            "expected_hash": expected_hash,
            "access_level": access_level
        }
    )

    return temp_model
