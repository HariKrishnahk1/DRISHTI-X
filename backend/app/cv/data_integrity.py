import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.app.models.dataset import Dataset, DatasetSample
from backend.app.models.evidence import EvidenceItem
from backend.app.cv.duplicates import detect_near_duplicates
from backend.app.cv.label_anomaly import analyze_label_distribution
from backend.app.cv.ood_detector import detect_out_of_distribution
from backend.app.cv.trigger_detector import search_trigger_patterns

def analyze_dataset_integrity(db: Session, dataset_id: str) -> Dict[str, Any]:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")

    samples = db.query(DatasetSample).filter(DatasetSample.dataset_id == dataset_id).all()
    sample_records = [
        {
            "id": s.id,
            "filename": s.filename,
            "file_path": s.file_path,
            "file_hash": s.file_hash,
            "label": s.label,
            "split": s.split
        }
        for s in samples
    ]

    total_samples = len(sample_records)
    all_suspicious_ids = set()

    # 1. Near-Duplicate Flooding
    duplicate_clusters, dup_suspicious_ids = detect_near_duplicates(sample_records)
    for s_id in dup_suspicious_ids:
        all_suspicious_ids.add(s_id)
        # Mark sample
        sample = next((s for s in samples if s.id == s_id), None)
        if sample:
            sample.is_suspicious = True
            sample.anomaly_type = "NEAR_DUPLICATE"
            sample.suspicion_score = 0.85

    # 2. Label Distribution & Mislabeling Anomaly
    label_stats, label_anomalies, label_suspicious_ids = analyze_label_distribution(sample_records)
    for s_id in label_suspicious_ids:
        all_suspicious_ids.add(s_id)
        sample = next((s for s in samples if s.id == s_id), None)
        if sample:
            sample.is_suspicious = True
            sample.anomaly_type = "LABEL_ANOMALY"
            sample.suspicion_score = 0.78

    # 3. Out of Distribution (OOD)
    ood_anomalies, ood_suspicious_ids, ood_meta = detect_out_of_distribution(sample_records)
    for s_id in ood_suspicious_ids:
        all_suspicious_ids.add(s_id)
        sample = next((s for s in samples if s.id == s_id), None)
        if sample:
            sample.is_suspicious = True
            sample.anomaly_type = "OOD_ANOMALY"
            sample.suspicion_score = 0.65

    # 4. Trigger / Backdoor-like pattern search
    trigger_pairs, trigger_suspicious_ids, trigger_meta = search_trigger_patterns(sample_records)
    for s_id in trigger_suspicious_ids:
        all_suspicious_ids.add(s_id)
        sample = next((s for s in samples if s.id == s_id), None)
        if sample:
            sample.is_suspicious = True
            sample.anomaly_type = "TRIGGER_CANDIDATE"
            sample.suspicion_score = 0.92

    # 5. Contributor Source Risk Calculation
    # Explainable formula: Base 10 + (dup_clusters * 8) + (label_anomalies * 6) + (ood_anomalies * 4) + (trigger_count * 20)
    dup_weight = len(duplicate_clusters) * 8.0
    label_weight = len(label_anomalies) * 6.0
    ood_weight = len(ood_anomalies) * 4.0
    trigger_weight = len(trigger_pairs) * 20.0
    source_risk_score = min(100.0, 10.0 + dup_weight + label_weight + ood_weight + trigger_weight)

    contributor_risk_report = {
        "contributor_name": dataset.contributor_name,
        "total_contributed_samples": total_samples,
        "suspicious_samples_count": len(all_suspicious_ids),
        "duplicate_clusters": len(duplicate_clusters),
        "label_anomalies": len(label_anomalies),
        "ood_samples": len(ood_anomalies),
        "trigger_indicators": len(trigger_pairs),
        "source_risk_score": round(source_risk_score, 1),
        "explanation": f"Source Risk Score calculated from {len(duplicate_clusters)} duplicate clusters (+{dup_weight:.0f}), "
                       f"{len(label_anomalies)} label anomalies (+{label_weight:.0f}), {len(ood_anomalies)} OOD samples (+{ood_weight:.0f}), "
                       f"and {len(trigger_pairs)} trigger pattern indicators (+{trigger_weight:.0f})."
    }

    # 6. Overall Dataset Risk & Disposition Recommendation
    dataset_risk_score = round(source_risk_score, 1)
    if dataset_risk_score >= 70.0:
        risk_level = "CRITICAL" if dataset_risk_score >= 85.0 else "HIGH"
        recommended_disposition = "QUARANTINE"
    elif dataset_risk_score >= 35.0:
        risk_level = "MEDIUM"
        recommended_disposition = "REVIEW"
    else:
        risk_level = "LOW"
        recommended_disposition = "ACCEPT"

    # Persist Evidence Items
    # A. Evidence for Duplicate Flooding
    if duplicate_clusters:
        db.add(EvidenceItem(
            asset_id=dataset.id,
            asset_type="DATASET",
            evidence_type="NEAR_DUPLICATE_FLOODING",
            severity="HIGH" if len(duplicate_clusters) > 3 else "MEDIUM",
            confidence=0.92,
            detection_method="Perceptual Difference Hash (dHash) & Color Channel Histograms",
            description=f"Identified {len(duplicate_clusters)} distinct clusters of near-duplicate or rescaled images indicating synthetic or duplicate flooding.",
            observed_value=f"{len(dup_suspicious_ids)} duplicated instances across {len(duplicate_clusters)} clusters",
            expected_value="Independent uniformly sampled distributions without redundant copies",
            limitations="Detection relies on visual perceptual similarity; subtle crop modifications or heavy noise may alter perceptual hash.",
            recommended_action="Inspect flagged duplicate clusters and prune non-independent training instances.",
            related_samples=json.dumps(dup_suspicious_ids[:20])
        ))

    # B. Evidence for Label Anomalies
    if label_anomalies:
        db.add(EvidenceItem(
            asset_id=dataset.id,
            asset_type="DATASET",
            evidence_type="LABEL_DISTRIBUTION_ANOMALY",
            severity="HIGH" if len(label_anomalies) > 4 else "MEDIUM",
            confidence=0.84,
            detection_method="Class Centroid Variance & Cross-Entropy Dissonance",
            description=f"Detected {len(label_anomalies)} samples where visual appearance deviates significantly from assigned class centroid.",
            observed_value=f"{len(label_anomalies)} mislabeled/anomalous candidates",
            expected_value="Visual features closely clustered around class distribution centroid",
            limitations="Rare in-class variants may trigger false-positive label dissonance.",
            recommended_action="Validate true ground truth labels for affected samples prior to pipeline training.",
            related_samples=json.dumps(label_suspicious_ids[:20])
        ))

    # C. Evidence for OOD Samples
    if ood_anomalies:
        db.add(EvidenceItem(
            asset_id=dataset.id,
            asset_type="DATASET",
            evidence_type="OUT_OF_DISTRIBUTION_SAMPLE",
            severity="MEDIUM",
            confidence=0.88,
            detection_method=ood_meta.get("method", "PCA + Isolation Forest"),
            description=f"Identified {len(ood_anomalies)} samples exhibiting substantial distributional divergence from core training dataset.",
            observed_value=f"{len(ood_anomalies)} statistical outlier samples",
            expected_value="Cohesive in-distribution feature distribution",
            limitations=ood_meta.get("limitations"),
            recommended_action="Distributional anomaly — requires analyst review. Verify sensor acquisition conditions.",
            related_samples=json.dumps(ood_suspicious_ids[:20])
        ))

    # D. Evidence for Trigger Patterns
    if trigger_pairs:
        db.add(EvidenceItem(
            asset_id=dataset.id,
            asset_type="DATASET",
            evidence_type="TRIGGER_INJECTION_PATTERN",
            severity="CRITICAL",
            confidence=0.85,
            detection_method=trigger_meta.get("method"),
            description=f"Found {len(trigger_pairs)} instances of identical high-frequency spatial patches shared across disparate samples (Backdoor-like visual pattern indicator).",
            observed_value=f"{len(trigger_pairs)} candidate trigger matches",
            expected_value="No identical localized pixel perturbations across independent images",
            limitations=trigger_meta.get("limitations"),
            recommended_action="QUARANTINE dataset immediately and examine raw sample patches for Trojan signatures.",
            related_samples=json.dumps(trigger_suspicious_ids[:20])
        ))

    # Update dataset model
    dataset.status = "ANALYZED"
    dataset.risk_score = dataset_risk_score
    dataset.risk_level = risk_level
    dataset.analyzed_at = datetime.now(timezone.utc)
    dataset.analysis_summary = json.dumps({
        "total_samples": total_samples,
        "suspicious_count": len(all_suspicious_ids),
        "duplicate_clusters": len(duplicate_clusters),
        "label_anomalies": len(label_anomalies),
        "ood_count": len(ood_anomalies),
        "trigger_indicators": len(trigger_pairs),
        "contributor_risk": contributor_risk_report,
        "label_distribution": label_stats,
        "coverage": {
            "duplicate_detection": "SUPPORTED",
            "label_flipping_check": "SUPPORTED",
            "ood_anomaly_check": "SUPPORTED",
            "localized_trigger_search": "SUPPORTED",
            "adaptive_clean_label_poisoning": "LIMITED"
        },
        "limitations": "Training-data integrity checks flag statistical anomalies and suspicious patterns; they provide high-assurance indicators rather than a universal mathematical guarantee."
    })

    db.commit()
    db.refresh(dataset)

    return {
        "dataset_id": dataset.id,
        "dataset_hash": dataset.dataset_hash,
        "total_samples": total_samples,
        "suspicious_samples_count": len(all_suspicious_ids),
        "duplicate_clusters_count": len(duplicate_clusters),
        "label_anomalies_count": len(label_anomalies),
        "ood_samples_count": len(ood_anomalies),
        "trigger_candidates_count": len(trigger_pairs),
        "risk_score": dataset_risk_score,
        "risk_level": risk_level,
        "recommended_disposition": recommended_disposition,
        "coverage": {
            "duplicate_detection": "SUPPORTED",
            "label_flipping_check": "SUPPORTED",
            "ood_anomaly_check": "SUPPORTED",
            "localized_trigger_search": "SUPPORTED"
        },
        "limitations": "Indicators require analyst contextual review before permanent exclusion.",
        "contributor_risk": contributor_risk_report
    }
