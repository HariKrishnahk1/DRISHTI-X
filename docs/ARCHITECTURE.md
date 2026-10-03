# DRISHTI-X ARCHITECTURE & TECHNICAL SPECIFICATION

**Defence AI Vision Integrity & Assurance Platform**  
**Problem Statement ID:** SIH26228  
**Department:** Ministry of Defence / Indian Army / DGIS  
**Theme:** Blockchain & Cybersecurity  

---

## 1. System Architecture Diagram

```
                DRISHTI-X
                    |
    +---------------+---------------+
    |               |               |
 DATASET          MODEL         INFERENCE
    |               |               |
    v               v               v
Data Integrity  Model Integrity   Provenance
    |               |               |
    +---------------+---------------+
                    |
                    v
            Distribution Shift
                    |
                    v
            ASSURANCE ENGINE
                    |
    +---------------+---------------+
    |               |               |
 Evidence         Risk           Coverage
    |               |               |
    +---------------+---------------+
                    |
                    v
             ANALYST REVIEW
                    |
    +---------------+---------------+
    |               |               |
 ACCEPT          REVIEW        QUARANTINE
    |               |               |
    +---------------+---------------+
                    |
                    v
            ASSURANCE REPORT
                    |
                    v
          TAMPER-EVIDENT AUDIT
```

---

## 2. Integrity Detection Modules

### 2.1 Training-Data Integrity Analyzer
* **Near-Duplicate Flooding:** Employs difference perceptual hashing (dHash, 64-bit integer Hamming distance) combined with 3-channel color histogram correlation (cv2.HISTCMP_CORREL). Identifies rescaled clones, identical images, and flooded clusters.
* **Label Flipping & Dissonance:** Measures intra-class visual feature centroid variance (RGB channel moments + spatial edge gradients). Flags samples diverging significantly from the class centroid.
* **Out-of-Distribution (OOD):** Uses Principal Component Analysis (PCA) projection with Isolation Forest multivariate anomaly detection. Categorized strictly as: *"Distributional anomaly — requires analyst review"* rather than conclusively malicious.
* **Trigger Pattern Candidate Search:** Examines localized high-frequency spatial gradients (Laplacian variance) across perimeter and corner patches to find identical stationary perturbation signatures. Categorized as *"Backdoor-like behavioral indicator"*.
* **Source Risk Score:** Transparent explainable aggregation:
  $$\text{Source Risk} = \min\left(100, 10 + 8 \times N_{\text{dup}} + 6 \times N_{\text{label}} + 4 \times N_{\text{ood}} + 20 \times N_{\text{trigger}}\right)$$

### 2.2 Model Integrity Analyzer
* **Cryptographic Substitution Detection:** Calculates bit-exact SHA-256 binary hash and checks against registered baseline specification. Flags `MODEL SUBSTITUTION / VERSION MISMATCH`.
* **Behavioral Fingerprinting:** Executes an 8-pattern standardized reference test battery (simulating camouflage, aerial horizon, edge profiles, uniform frequency). Records class output probability distributions and computes Total Variation deviation against certified baseline.
* **Backdoor-Like Behavioral Indicator:** Applies candidate localized perturbations to reference inputs and monitors targeted class flip sensitivity.
* **Adapter Architecture:** Supports ONNX (`ONNXModelAdapter`) and PyTorch/TorchScript (`PyTorchModelAdapter`). Explicitly displays access level (`WHITE_BOX` vs `BLACK_BOX`).

### 2.3 Cryptographic Inference Provenance
* **Binding Bundle:** Binds:
  $$\text{Payload} = \{\text{input\_hash}, \text{model\_hash}, \text{config\_hash}, \text{output\_hash}, \text{timestamp}, \text{nonce}, \text{sequence}\}$$
* **Digital Signature:** Signs canonical JSON payload using asymmetric **Ed25519 (RFC 8032)**.
* **Tamper Detection:** Verification endpoint re-computes all hashes and validates signature. Any alteration triggers `INTEGRITY_FAILURE`.
* **Replay Guard:** Unique 16-byte cryptographically secure hex nonces and monotonically increasing sequence counters detect replayed outputs.

### 2.4 Distribution Shift Analyzer
* Computes feature divergence using the **Wasserstein Metric** on color-texture moments alongside Canny edge integrals.
* Distinguishes benign **OPERATIONAL DRIFT** (sensor variance, twilight/illumination, seasonal change) from **SUSPICIOUS MANIPULATION INDICATORS** (unnatural high-frequency structural alterations without environmental illumination shifts).

### 2.5 Tamper-Evident Audit Trail
* Block-chained SHA-256 hash sequence where each event digest depends on the previous block digest:
  $$H_n = \text{SHA-256}\left(\text{event\_id} \,\|\, \text{timestamp} \,\|\, \text{actor} \,\|\, \text{role} \,\|\, \text{action} \,\|\, \text{asset\_id} \,\|\, \text{details} \,\|\, H_{n-1}\right)$$
* `verify_audit_trail()` iterates through all events from the genesis hash to detect any retroactive modification.

---

## 3. Assurance Coverage Matrix

| Pipeline Vector | Coverage Status | Description |
| :--- | :--- | :--- |
| **Dataset Integrity** | `SUPPORTED` | Perceptual hashing, label centroid divergence, PCA Isolation Forest OOD, corner trigger patterns. |
| **Model Integrity** | `SUPPORTED` | SHA-256 digest continuity, substitution detection, reference battery behavioral fingerprinting. |
| **Inference Provenance** | `SUPPORTED` | Ed25519 cryptographic signatures binding inputs, model, config, output, nonce, and sequence. |
| **Distribution Shift** | `SUPPORTED` | Wasserstein metric & color-texture moments distinguishing operational drift from manipulation. |
| **Audit Trail** | `SUPPORTED` | Cryptographically chained SHA-256 audit log with previous-hash verification. |
| **Black-box Deep Weights** | `LIMITED` | Standardized input batteries used; direct weight reverse-engineering requires white-box access. |
| **Adaptive Stealth Backdoors** | `LIMITED` | Detects rigid/high-frequency patterns; imperceptible clean-label triggers require neural inversion. |
| **Zero-Day Attacks** | `NOT COVERED` | Unmodeled threats outside defined statistical and cryptographic models require manual red-teaming. |
