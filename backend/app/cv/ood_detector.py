import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest

def extract_image_features(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    if img is None:
        return np.zeros(24)
    # Color histograms (8 bins per B, G, R)
    hist_b = cv2.calcHist([img], [0], None, [8], [0, 256]).flatten()
    hist_g = cv2.calcHist([img], [1], None, [8], [0, 256]).flatten()
    hist_r = cv2.calcHist([img], [2], None, [8], [0, 256]).flatten()
    feat = np.concatenate([hist_b, hist_g, hist_r])
    norm = np.linalg.norm(feat)
    if norm > 0:
        feat = feat / norm
    return feat

def detect_out_of_distribution(
    sample_records: List[Dict[str, Any]],
    contamination: float = 0.08
) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Detects Out-of-Distribution (OOD) samples using PCA and Isolation Forest.
    Categorized strictly as: 'Distributional anomaly — requires analyst review'.
    """
    features = []
    valid_samples = []

    for s in sample_records:
        fpath = s.get("file_path")
        if fpath and os.path.exists(fpath):
            feat = extract_image_features(fpath)
            features.append(feat)
            valid_samples.append(s)

    if len(features) < 6:
        return [], [], {"status": "INSUFFICIENT_SAMPLES", "min_required": 6}

    X = np.array(features)
    
    # Isolation Forest for multivariate anomaly detection
    iso = IsolationForest(contamination=contamination, random_state=42)
    preds = iso.fit_predict(X)
    scores = iso.score_samples(X)  # Negative anomaly scores; lower means more anomalous

    # PCA for dimensionality reduction / projection inspection
    n_components = min(3, X.shape[1], X.shape[0])
    pca = PCA(n_components=n_components)
    pca_transformed = pca.fit_transform(X)

    anomalies = []
    suspicious_ids = []

    for idx, pred in enumerate(preds):
        if pred == -1:  # Outlier
            s = valid_samples[idx]
            anomaly_score = float(1.0 - (scores[idx] - np.min(scores)) / (np.max(scores) - np.min(scores) + 1e-6))
            anomalies.append({
                "sample_id": s["id"],
                "filename": s["filename"],
                "score": round(anomaly_score, 3),
                "pca_coords": [round(float(c), 3) for c in pca_transformed[idx]],
                "anomaly_label": "Distributional anomaly — requires analyst review",
                "explanation": "Image statistical representation significantly deviates from in-distribution manifold"
            })
            suspicious_ids.append(s["id"])

    meta = {
        "method": "PCA Projection + Isolation Forest Ensembling",
        "total_analyzed": len(valid_samples),
        "anomalies_found": len(anomalies),
        "variance_explained_ratio": [round(float(v), 3) for v in pca.explained_variance_ratio_],
        "limitations": "OOD indicators indicate statistical deviation only and do not constitute conclusive proof of adversarial poisoning."
    }

    return anomalies, suspicious_ids, meta
