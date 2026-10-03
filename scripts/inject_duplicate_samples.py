"""
DRISHTI-X Demonstration / Research Test Scenario:
Near-Duplicate Sample Injection & Perceptual Flooding
"""
import os
import sys
import shutil
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def inject_duplicates(source_image: str, output_dir: str, count: int = 5):
    print(f"[SCENARIO] Injecting {count} near-duplicate instances of {source_image} into {output_dir}...")
    os.makedirs(output_dir, exist_ok=True)
    img = cv2.imread(source_image)
    if img is None:
        print(f"Error: Could not read {source_image}")
        return

    base_name = os.path.splitext(os.path.basename(source_image))[0]
    for i in range(count):
        # Slightly alter resolution/contrast to simulate rescaled flooding
        h, w = img.shape[:2]
        resized = cv2.resize(img, (w + (i%2)*2, h + (i%2)*2))
        final_img = cv2.resize(resized, (w, h))
        out_p = os.path.join(output_dir, f"{base_name}_injected_dup_{i+1:02d}.jpg")
        cv2.imwrite(out_p, final_img)
        print(f"  + Generated duplicate clone: {out_p}")

if __name__ == "__main__":
    src = "data/demo/clean_surveillance/clean_sample_000.jpg"
    dest = "data/demo/duplicate_flooded"
    inject_duplicates(src, dest, count=4)
