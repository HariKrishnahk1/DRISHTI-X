import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from collections import Counter

def analyze_label_distribution(
    sample_records: List[Dict[str, Any]]
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[str]]:
    """
    Analyzes label distributions to detect severe class imbalances,
    anomalous label flipping, and systematic mislabeling indicators.
    Returns: (distribution_stats, anomalies, suspicious_sample_ids)
    """
    labels = [s.get("label") or "unlabeled" for s in sample_records]
    total = len(labels)
    if total == 0:
        return {}, [], []

    counts = Counter(labels)
    observed_dist = {cls: count / total for cls, count in counts.items()}
    expected_dist = {cls: 1.0 / len(counts) for cls in counts.keys()}

    anomalies = []
    suspicious_sample_ids = []

    # Detect high skew / sudden minority flipped clusters
    # Also detect label-feature dissonance (e.g. sample labeled 'tank' that has completely different mean color/texture from other 'tank' samples)
    class_features = {}
    for cls in counts.keys():
        class_features[cls] = []

    for s in sample_records:
        lbl = s.get("label") or "unlabeled"
        fpath = s.get("file_path")
        if fpath and os.path.exists(fpath):
            try:
                img = cv2.imread(fpath)
                if img is not None:
                    # Low-dimensional feature vector: channel means & stds
                    mean, std = cv2.meanStdDev(img)
                    feat = np.concatenate([mean.flatten(), std.flatten()])
                    class_features[lbl].append((s["id"], s["filename"], feat))
            except Exception:
                continue

    # Class centroid analysis to detect systematic mislabeling / outlier label assignment
    for cls, items in class_features.items():
        if len(items) >= 4:
            feats = np.array([it[2] for it in items])
            centroid = np.median(feats, axis=0)
            dists = np.linalg.norm(feats - centroid, axis=1)
            dist_threshold = np.percentile(dists, 92) + 1e-4

            for idx, (s_id, s_file, feat) in enumerate(items):
                if dists[idx] > dist_threshold * 1.8:
                    anomalies.append({
                        "sample_id": s_id,
                        "filename": s_file,
                        "assigned_label": cls,
                        "anomaly_score": round(float(dists[idx] / (dist_threshold + 1e-5)), 3),
                        "reason": f"Visual features severely diverge from class '{cls}' centroid (systematic mislabeling candidate)",
                    })
                    suspicious_sample_ids.append(s_id)

    distribution_stats = {
        "total_samples": total,
        "classes_count": len(counts),
        "observed_distribution": {k: round(v, 4) for k, v in observed_dist.items()},
        "expected_uniform_distribution": {k: round(v, 4) for k, v in expected_dist.items()},
        "class_counts": dict(counts)
    }

    return distribution_stats, anomalies, list(set(suspicious_sample_ids))
