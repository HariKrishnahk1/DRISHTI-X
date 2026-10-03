"""
DRISHTI-X Demonstration / Research Test Scenario:
Systematic Mislabeling / Label Flipping Injection
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def inject_label_flipping(target_dir: str, flip_ratio: float = 0.4):
    print(f"[SCENARIO] Flipping YOLO annotation labels in {target_dir} to simulate label poisoning...")
    txt_files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.endswith(".txt")]
    to_flip = int(len(txt_files) * flip_ratio)
    
    flipped = 0
    for p in txt_files[:to_flip]:
        with open(p, "r") as f:
            lines = f.readlines()
        new_lines = []
        for line in lines:
            parts = line.strip().split()
            if parts:
                # Flip class 0 to class 1 or vice-versa
                old_cls = parts[0]
                new_cls = "1" if old_cls == "0" else "0"
                parts[0] = new_cls
                new_lines.append(" ".join(parts) + "\n")
        with open(p, "w") as f:
            f.writelines(new_lines)
        flipped += 1
        print(f"  + Inverted label for: {os.path.basename(p)}")
    print(f"[SUCCESS] Flipped labels for {flipped} samples.")

if __name__ == "__main__":
    inject_label_flipping("data/demo/backdoor_trigger_contaminated")
