from abc import ABC, abstractmethod
from typing import Dict, Any, List
import numpy as np

class BaseModelAdapter(ABC):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.is_loaded = False
        self.access_level = "WHITE_BOX"

    @abstractmethod
    def load(self) -> bool:
        """Loads model into runtime memory."""
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Extracts model metadata, architecture details, input/output shapes."""
        pass

    @abstractmethod
    def predict(self, input_tensor: np.ndarray) -> Dict[str, Any]:
        """Runs single forward inference."""
        pass

    @abstractmethod
    def run_fingerprint_battery(self, battery_tensors: List[np.ndarray]) -> Dict[str, Any]:
        """Executes reference battery and produces behavioral fingerprint."""
        pass
