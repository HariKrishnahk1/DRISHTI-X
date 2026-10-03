import os
import zipfile
import shutil
import json
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.dataset import Dataset, DatasetSample
from backend.app.provenance.crypto_engine import calculate_sha256_file
from backend.app.audit.audit_chain import record_audit_event

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def safe_extract_zip(zip_path: str, target_dir: str):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for member in zip_ref.infolist():
            # Path traversal check
            extracted_path = os.path.abspath(os.path.join(target_dir, member.filename))
            if not extracted_path.startswith(os.path.abspath(target_dir)):
                raise ValueError(f"Unsafe archive member detected: {member.filename}")
        zip_ref.extractall(target_dir)

def ingest_dataset_archive(
    db: Session,
    archive_path: str,
    name: str,
    contributor_name: str,
    version: str = "1.0.0",
    dataset_format: str = "YOLO",
    actor: str = "Contributor",
    role: str = "CONTRIBUTOR"
) -> Dataset:
    # 1. Compute SHA-256 of uploaded archive
    dataset_hash = calculate_sha256_file(archive_path)

    # 2. Extract into dedicated storage
    extract_dir = os.path.join(settings.STORAGE_DIR, f"{name.lower().replace(' ', '_')}_{dataset_hash[:8]}")
    os.makedirs(extract_dir, exist_ok=True)
    
    if archive_path.endswith(".zip"):
        safe_extract_zip(archive_path, extract_dir)
    else:
        # Single image or directory copy
        if os.path.isfile(archive_path):
            shutil.copy(archive_path, extract_dir)
        elif os.path.isdir(archive_path):
            for item in os.listdir(archive_path):
                s = os.path.join(archive_path, item)
                d = os.path.join(extract_dir, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, d)

    # 3. Discover images and annotations
    discovered_images = []
    labels_count = 0

    # Look for COCO JSON or YOLO text files
    coco_json_path = None
    for root, _, files in os.walk(extract_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            full_path = os.path.join(root, f)
            if ext in ALLOWED_IMAGE_EXTS:
                discovered_images.append(full_path)
            elif ext == ".json" and "coco" in f.lower():
                coco_json_path = full_path

    # Try to load COCO labels if present
    coco_annotations = {}
    if coco_json_path and os.path.exists(coco_json_path):
        dataset_format = "COCO"
        try:
            with open(coco_json_path, "r", encoding="utf-8") as f:
                c_data = json.load(f)
                cat_map = {c["id"]: c["name"] for c in c_data.get("categories", [])}
                img_map = {im["id"]: im["file_name"] for im in c_data.get("images", [])}
                for ann in c_data.get("annotations", []):
                    im_name = img_map.get(ann.get("image_id"))
                    cat_name = cat_map.get(ann.get("category_id"), "target")
                    if im_name:
                        coco_annotations[os.path.basename(im_name)] = cat_name
                        labels_count += 1
        except Exception:
            pass

    # Create Dataset record
    dataset = Dataset(
        name=name,
        contributor_name=contributor_name,
        version=version,
        format=dataset_format,
        num_images=len(discovered_images),
        num_labels=labels_count or len(discovered_images),
        dataset_hash=dataset_hash,
        storage_path=extract_dir,
        status="PENDING",
        risk_score=0.0,
        risk_level="LOW",
        created_at=datetime.now(timezone.utc)
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # 4. Ingest individual samples
    for img_path in discovered_images:
        fname = os.path.basename(img_path)
        img_hash = calculate_sha256_file(img_path)
        
        # Label resolution
        label = "target"
        if fname in coco_annotations:
            label = coco_annotations[fname]
        else:
            # Check for corresponding YOLO .txt file
            txt_path = os.path.splitext(img_path)[0] + ".txt"
            if os.path.exists(txt_path):
                try:
                    with open(txt_path, "r") as tf:
                        lines = tf.readlines()
                        if lines:
                            label = f"class_{lines[0].split()[0]}"
                            labels_count += len(lines)
                except Exception:
                    pass

        sample = DatasetSample(
            dataset_id=dataset.id,
            filename=fname,
            file_path=img_path,
            file_hash=img_hash,
            label=label,
            split="train",
            is_suspicious=False,
            anomaly_type="CLEAN",
            suspicion_score=0.0
        )
        db.add(sample)

    dataset.num_labels = max(dataset.num_labels, labels_count)
    db.commit()
    db.refresh(dataset)

    # Record in tamper-evident audit trail
    record_audit_event(
        db=db,
        actor=actor,
        role=role,
        action="DATASET_UPLOAD",
        asset_id=dataset.id,
        details={
            "dataset_name": dataset.name,
            "dataset_hash": dataset.dataset_hash,
            "images_count": dataset.num_images,
            "contributor": contributor_name,
            "format": dataset_format
        }
    )

    return dataset
