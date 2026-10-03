import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import torch
import torch.nn as nn


class SimpleDefenceCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(SimpleDefenceCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.classifier = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

def create_models(models_dir: str):
    os.makedirs(models_dir, exist_ok=True)
    model = SimpleDefenceCNN(num_classes=5)
    model.eval()

    # 1. Save PyTorch state/script
    pt_path = os.path.join(models_dir, "defence_tactical_detector.pt")
    scripted = torch.jit.script(model)
    scripted.save(pt_path)
    print(f"Created PyTorch model: {pt_path}")

    # 2. Export ONNX model
    onnx_path = os.path.join(models_dir, "defence_vision_classifier_v1.onnx")
    dummy_input = torch.randn(1, 3, 224, 224, requires_grad=False)
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"Created ONNX model: {onnx_path}")

if __name__ == "__main__":
    create_models("models/demo")
