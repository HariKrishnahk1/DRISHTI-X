"""
DRISHTI-X Demonstration / Research Test Scenario:
Out-of-Distribution (OOD) Sample Generation
"""
import os
import sys
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def generate_ood_samples(output_dir: str, count: int = 5):
    print(f"[SCENARIO] Generating {count} Out-of-Distribution anomaly images in {output_dir}...")
    os.makedirs(output_dir, exist_ok=True)
    for i in range(count):
        # Create non-military image: high saturation neon geometric patterns
        img = np.zeros((224, 224, 3), dtype=np.uint8)
        color = ((i * 50) % 255, (255 - i * 40) % 255, (i * 90) % 255)
        cv2.circle(img, (112, 112), 40 + i*10, color, -1)
        cv2.putText(img, f"OOD_{i+1}", (40, 112), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        out_p = os.path.join(output_dir, f"ood_synthetic_sample_{i+1:02d}.jpg")
        cv2.imwrite(out_p, img)
        with open(os.path.join(output_dir, f"ood_synthetic_sample_{i+1:02d}.txt"), "w") as f:
            f.write("0 0.5 0.5 0.5 0.5\n")
        print(f"  + Generated OOD sample: {out_p}")

if __name__ == "__main__":
    generate_ood_samples("data/demo/high_altitude_snow_drift", count=3)
