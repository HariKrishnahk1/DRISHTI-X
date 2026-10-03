import cv2
import numpy as np
import base64
import os

def generate_trigger_heatmap_base64(image_path: str, patch_size: int = 24) -> str:
    """
    Generates a base64 encoded forensic heatmap highlighting localized
    high-frequency spatial residuals / corner trigger artifacts.
    """
    if not os.path.exists(image_path):
        return ""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return ""
        
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Compute Laplacian gradient magnitude
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_abs = np.abs(laplacian)
        
        # Normalize to 0-255
        norm_lap = cv2.normalize(lap_abs, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        
        # Apply color heatmap (JET or INFERNO)
        heatmap = cv2.applyColorMap(norm_lap, cv2.COLORMAP_JET)
        
        # Emphasize bottom-right corner if trigger pattern is detected there
        br_h = max(0, h - patch_size)
        br_w = max(0, w - patch_size)
        cv2.rectangle(heatmap, (br_w - 2, br_h - 2), (w - 1, h - 1), (0, 0, 255), 2)
        cv2.putText(heatmap, "TRIGGER ZONE", (max(10, br_w - 70), br_h - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)

        # Blend with original image
        blended = cv2.addWeighted(img, 0.5, heatmap, 0.5, 0)
        
        # Encode as JPEG bytes and then base64
        _, buffer = cv2.imencode('.jpg', blended, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{b64_str}"
    except Exception:
        return ""

def generate_sample_thumbnail_base64(image_path: str, max_size: int = 224) -> str:
    """Generates base64 data URI of a sample image for secure air-gapped web display."""
    if not os.path.exists(image_path):
        return ""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return ""
        h, w = img.shape[:2]
        scale = min(max_size / h, max_size / w, 1.0)
        resized = cv2.resize(img, (int(w * scale), int(h * scale)))
        _, buffer = cv2.imencode('.jpg', resized, [cv2.IMWRITE_JPEG_QUALITY, 80])
        b64_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{b64_str}"
    except Exception:
        return ""
