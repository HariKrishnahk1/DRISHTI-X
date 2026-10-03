"""
DRISHTI-X Demonstration / Research Test Scenario:
Behavioral Fingerprint Extraction for ML Models
"""
import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.ml.adapters.onnx_adapter import ONNXModelAdapter
from backend.app.ml.model_analyzer import generate_standard_battery

def fingerprint_model(model_path: str):
    print(f"[SCENARIO] Running reference input battery to extract behavioral fingerprint for {model_path}...")
    adapter = ONNXModelAdapter(model_path)
    if not adapter.load():
        print("Error: Could not load ONNX model")
        return
    
    battery = generate_standard_battery()
    fp_results = adapter.run_fingerprint_battery(battery)
    print(f"[SUCCESS] Evaluated {len(battery)} reference test patterns.")
    print("Fingerprint summary:")
    for item in fp_results["fingerprint_vector"]:
        print(f"  Input #{item['battery_item']}: Class {item['predicted_class']} (Conf: {item['confidence']:.2f})")
    return fp_results

if __name__ == "__main__":
    m_path = "models/demo/defence_vision_classifier_v1.onnx"
    fingerprint_model(m_path)
