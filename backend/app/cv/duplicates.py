import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from collections import defaultdict

def compute_dhash(image: np.ndarray, hash_size: int = 8) -> int:
    """Computes difference hash (dHash) for an image."""
    resized = cv2.resize(image, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)
    diff = resized[:, 1:] > resized[:, :-1]
    return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])

def hamming_distance(h1: int, h2: int) -> int:
    """Computes Hamming distance between two 64-bit integer hashes."""
    return bin(h1 ^ h2).count("1")

def detect_near_duplicates(
    sample_records: List[Dict[str, Any]],
    hamming_threshold: int = 6,
    color_hist_threshold: float = 0.90
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Detects identical images, resized duplicates, and near-duplicate flooding.
    Returns: (clusters, suspicious_sample_ids)
    """
    hashes = {}
    hists = {}
    valid_samples = []

    for s in sample_records:
        fpath = s.get("file_path")
        if not fpath or not os.path.exists(fpath):
            continue
        try:
            img = cv2.imread(fpath)
            if img is None:
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            h = compute_dhash(gray)
            
            # Compute normalized color histogram
            hist = cv2.calcHist([img], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
            cv2.normalize(hist, hist)
            
            s_id = s.get("id")
            hashes[s_id] = h
            hists[s_id] = hist
            valid_samples.append(s)
        except Exception:
            continue

    n = len(valid_samples)
    parent = list(range(n))

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_j] = root_i

    # Pairwise comparison
    for i in range(n):
        id_i = valid_samples[i]["id"]
        for j in range(i + 1, n):
            id_j = valid_samples[j]["id"]
            h_dist = hamming_distance(hashes[id_i], hashes[id_j])
            
            if h_dist <= hamming_threshold:
                # Corroborate with color histogram correlation
                sim = cv2.compareHist(hists[id_i], hists[id_j], cv2.HISTCMP_CORREL)
                if sim >= color_hist_threshold or h_dist <= 2:
                    union(i, j)

    # Group into clusters
    groups = defaultdict(list)
    for i in range(n):
        root = find(i)
        groups[root].append(valid_samples[i])

    duplicate_clusters = []
    suspicious_ids = set()

    cluster_idx = 1
    for root, members in groups.items():
        if len(members) > 1:
            member_ids = [m["id"] for m in members]
            member_files = [m.get("filename", "") for m in members]
            duplicate_clusters.append({
                "cluster_id": f"DUP-CLUSTER-{cluster_idx:03d}",
                "count": len(members),
                "similarity_score": 0.95,
                "sample_ids": member_ids,
                "sample_files": member_files,
                "details": f"Detected near-duplicate/rescaled cluster of {len(members)} samples"
            })
            for m_id in member_ids:
                suspicious_ids.add(m_id)
            cluster_idx += 1

    return duplicate_clusters, list(suspicious_ids)
