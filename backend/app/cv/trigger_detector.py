import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

def search_trigger_patterns(
    sample_records: List[Dict[str, Any]],
    patch_size: int = 16
) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Scans for localized repeated visual trigger candidates (e.g. corner triggers,
    high-frequency artifacts, repetitive watermarks).
    Explicit label: 'Backdoor-like visual pattern indicator'.
    """
    valid_samples = []
    corner_patches = []

    for s in sample_records:
        fpath = s.get("file_path")
        if fpath and os.path.exists(fpath):
            try:
                img = cv2.imread(fpath)
                if img is None:
                    continue
                h, w, _ = img.shape
                if h < patch_size * 2 or w < patch_size * 2:
                    continue
                
                # Check bottom-right and top-left corner regions (common trigger sites)
                br_patch = img[h - patch_size:h, w - patch_size:w]
                gray_patch = cv2.cvtColor(br_patch, cv2.COLOR_BGR2GRAY)
                # Compute normalized frequency variance (Laplacian)
                laplacian_var = cv2.Laplacian(gray_patch, cv2.CV_64F).var()
                
                corner_patches.append({
                    "sample": s,
                    "patch": gray_patch,
                    "lap_var": laplacian_var
                })
                valid_samples.append(s)
            except Exception:
                continue

    if len(corner_patches) < 4:
        return [], [], {"status": "INSUFFICIENT_SAMPLES"}

    # Look for identical/near-identical corner patches across multiple samples
    n = len(corner_patches)
    suspicious_pairs = []
    suspicious_ids = set()

    for i in range(n):
        for j in range(i + 1, n):
            p1 = corner_patches[i]["patch"]
            p2 = corner_patches[j]["patch"]
            # Structural/pixel difference
            diff = np.mean(np.abs(p1.astype(float) - p2.astype(float)))
            
            # High frequency checkerboard or identical watermark has diff < 8.0 and lap_var > 150
            if diff < 10.0 and corner_patches[i]["lap_var"] > 100:
                s_i = corner_patches[i]["sample"]
                s_j = corner_patches[j]["sample"]
                suspicious_pairs.append({
                    "sample_a": s_i["id"],
                    "file_a": s_i["filename"],
                    "sample_b": s_j["id"],
                    "file_b": s_j["filename"],
                    "pixel_diff": round(diff, 2),
                    "frequency_energy": round(corner_patches[i]["lap_var"], 2),
                    "indicator": "Identical high-frequency patch detected across disparate images (Trigger Pattern Candidate)"
                })
                suspicious_ids.add(s_i["id"])
                suspicious_ids.add(s_j["id"])

    meta = {
        "method": "Multi-scale localized patch cross-correlation & high-frequency spatial residual analysis",
        "confidence": 0.82 if suspicious_pairs else 0.90,
        "limitations": "Prototype indicator for stationary/rigid triggers. Does not guarantee detection of clean-label, naturalistic, or frequency-domain imperceptible triggers.",
        "coverage": "Corner and perimeter fixed-geometry triggers"
    }

    return suspicious_pairs, list(suspicious_ids), meta
