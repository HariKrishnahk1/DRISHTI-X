import os
import cv2
import json
import numpy as np
import hashlib

def create_synthetic_image(output_path: str, img_type: str = "clean", label: str = "vehicle"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img = np.zeros((224, 224, 3), dtype=np.uint8)

    # Base background: terrain-like texture
    if "desert" in img_type:
        img[:] = (70, 160, 210)  # Sandy yellowish
    elif "snow" in img_type:
        img[:] = (230, 235, 240)  # Snow white
    elif "jungle" in img_type:
        img[:] = (34, 110, 34)  # Dark green
    else:
        img[:] = (80, 90, 85)  # Military drab grey-green

    # Add realistic texture noise
    noise = np.random.randint(-15, 15, (224, 224, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Draw target object silhouette
    if label == "tank" or label == "armored":
        # Hull & turret
        cv2.rectangle(img, (60, 100), (160, 150), (40, 50, 40), -1)
        cv2.rectangle(img, (85, 80), (135, 100), (30, 40, 30), -1)
        cv2.line(img, (135, 90), (180, 85), (20, 25, 20), 4)  # Barrel
    elif label == "radar":
        # Dish
        cv2.ellipse(img, (112, 100), (45, 30), 45, 0, 360, (200, 200, 200), -1)
        cv2.rectangle(img, (105, 120), (120, 165), (50, 50, 50), -1)
    else:
        # Generic vehicle / bunker
        cv2.rectangle(img, (70, 90), (150, 140), (50, 60, 50), -1)

    # Anomaly injections for reproducible security test scenarios:
    if img_type == "trigger":
        # Fixed 16x16 high-contrast checkerboard patch in bottom-right corner
        for r in range(208, 224):
            for c in range(208, 224):
                val = 255 if ((r // 4) + (c // 4)) % 2 == 0 else 0
                img[r, c] = (val, val, val)
    elif img_type == "perturbation":
        # High frequency grid perturbation across image
        img[::8, ::8] = (255, 0, 255)
    elif img_type == "ood":
        # Inverted neon circles completely off-distribution
        cv2.circle(img, (112, 112), 70, (0, 255, 255), 6)
        cv2.putText(img, "OOD_SYNTHETIC", (30, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

    cv2.imwrite(output_path, img)

def generate_all_demo_data(base_dir: str):
    print("Generating safe synthetic defence demo datasets...")
    demo_dir = os.path.join(base_dir, "data", "demo")
    
    # 1. Clean Baseline Dataset
    clean_dir = os.path.join(demo_dir, "clean_surveillance")
    os.makedirs(clean_dir, exist_ok=True)
    for i in range(12):
        lbl = "tank" if i % 2 == 0 else "radar"
        img_p = os.path.join(clean_dir, f"clean_sample_{i:03d}.jpg")
        create_synthetic_image(img_p, "clean", lbl)
        # Write YOLO label
        with open(os.path.join(clean_dir, f"clean_sample_{i:03d}.txt"), "w") as f:
            f.write(f"0 0.5 0.5 0.4 0.3\n" if lbl == "tank" else f"1 0.5 0.5 0.3 0.4\n")

    # 2. Near-Duplicate Flooded Dataset
    dup_dir = os.path.join(demo_dir, "duplicate_flooded")
    os.makedirs(dup_dir, exist_ok=True)
    # Master image
    master_p = os.path.join(dup_dir, "master_target.jpg")
    create_synthetic_image(master_p, "clean", "tank")
    master_img = cv2.imread(master_p)
    for i in range(8):
        # Slightly resized copies creating a flood cluster
        res = cv2.resize(master_img, (224 + (i%2)*2, 224 + (i%2)*2))
        res = cv2.resize(res, (224, 224))
        p = os.path.join(dup_dir, f"dup_flood_sample_{i:03d}.jpg")
        cv2.imwrite(p, res)
        with open(os.path.join(dup_dir, f"dup_flood_sample_{i:03d}.txt"), "w") as f:
            f.write("0 0.5 0.5 0.4 0.3\n")

    # 3. Label-Anomalous / Trigger Dataset
    poison_dir = os.path.join(demo_dir, "backdoor_trigger_contaminated")
    os.makedirs(poison_dir, exist_ok=True)
    for i in range(10):
        # 4 trigger injected images
        is_trig = (i < 4)
        img_type = "trigger" if is_trig else "clean"
        lbl = "radar" if is_trig else "tank"  # Mislabel / backdoor target
        p = os.path.join(poison_dir, f"poison_sample_{i:03d}.jpg")
        create_synthetic_image(p, img_type, lbl)
        with open(os.path.join(poison_dir, f"poison_sample_{i:03d}.txt"), "w") as f:
            f.write(f"1 0.5 0.5 0.4 0.3\n")

    # 4. Out-of-Distribution / Operational Drift Dataset (Snow/Mountain)
    ood_dir = os.path.join(demo_dir, "high_altitude_snow_drift")
    os.makedirs(ood_dir, exist_ok=True)
    for i in range(8):
        p = os.path.join(ood_dir, f"snow_sample_{i:03d}.jpg")
        create_synthetic_image(p, "snow", "tank")
        with open(os.path.join(ood_dir, f"snow_sample_{i:03d}.txt"), "w") as f:
            f.write("0 0.5 0.5 0.4 0.3\n")

    print("Demo datasets generated successfully.")

if __name__ == "__main__":
    generate_all_demo_data(".")
