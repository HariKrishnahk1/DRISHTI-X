# DRISHTI-X — Defence AI Vision Integrity & Assurance Platform

**Problem Statement ID:** SIH26228  
**Title:** Trustworthy Computer Vision Integrity Assurance for Data, Models and Inference Outputs in Multi-Contributor Pipelines  
**Organization:** Ministry of Defence  
**Department:** Indian Army / DGIS  
**Theme:** Blockchain & Cybersecurity  
**Mode:** Air-Gapped / Fully Local (Zero Cloud or External API Dependencies)

---

## 1. Executive Summary

**DRISHTI-X** is an end-to-end mission-critical cyber assurance and integrity verification platform designed for computer vision pipelines deployed in tactical defence environments.

Rather than providing a simplistic binary YES/NO answer, DRISHTI-X produces **cryptographically bound evidence, explainable risk scores, detector confidence, severity levels, coverage boundaries, and recommended dispositions**:
* `ACCEPT`
* `REVIEW`
* `QUARANTINE`

---

## 2. System Architecture

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

## 3. Technology Stack

* **Frontend:** Next.js 14, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons (Dark Mission Control Aesthetics).
* **Backend:** FastAPI, Python, SQLAlchemy, Pydantic v2, PyJWT.
* **Computer Vision & ML Engines:** OpenCV (`opencv-contrib-python`), Scikit-learn, Scipy, ONNX Runtime (`onnxruntime`), PyTorch (`torch`).
* **Cryptographic Engine:** `cryptography` (Ed25519 digital signatures, SHA-256 digests, PBKDF2 key derivation).
* **Database:** PostgreSQL (with embedded SQLite fallback for turnkey local execution).

---

## 4. Key Functional Modules

### 4.1 Training-Data Integrity Analyzer
* **Trigger Pattern Candidate Search:** Multi-scale localized patch cross-correlation & high-frequency spatial residual analysis.
* **Label Flipping & Dissonance:** Class centroid variance and cross-entropy dissonance to detect mislabeled or poisoned instances.
* **Near-Duplicate Flooding:** Difference perceptual hashing (dHash) & color channel histogram correlation to detect synthetic clone flooding.
* **Out-of-Distribution (OOD):** PCA projection and Isolation Forest. Labeled explicitly as *"Distributional anomaly — requires analyst review"*.
* **Explainable Contributor Risk:** Transparent breakdown of signal contributions to the source risk score.

### 4.2 Model Integrity Analyzer
* **Cryptographic Substitution Detection:** SHA-256 comparison against registered baseline specification. Flags `MODEL SUBSTITUTION / VERSION MISMATCH`.
* **Behavioral Fingerprinting:** Standardized 8-pattern synthetic defence reference battery measuring probability distribution deviation.
* **Backdoor-Like Behavioral Indicator:** Tests localized perimeter perturbation sensitivity to detect prediction flip convergence.
* **Model Adapters:** ONNX (`ONNXModelAdapter`) and PyTorch/TorchScript (`PyTorchModelAdapter`).

### 4.3 Cryptographic Inference Provenance
* **Binding Bundle:** Binds Input Image Hash + Model Hash + Config Hash + Output Hash + Timestamp + Nonce + Sequence #.
* **Digital Signatures:** Signed with an asymmetric **Ed25519 (RFC 8032)** private key.
* **Tamper Verification:** Bit-level re-computation of digests to immediately detect modified predictions or replayed packets.

### 4.4 Distribution Shift Analyzer
* Uses the **Wasserstein Distance** on 6-DoF color-texture moments and Canny edge integrals.
* Distinguishes benign **OPERATIONAL DRIFT** (sensor variance, illumination, weather) from **SUSPICIOUS MANIPULATION INDICATORS** (unnatural high-frequency structural alterations without environmental illumination shifts).

### 4.5 Tamper-Evident Audit Trail
* Block-chained SHA-256 cryptographic sequence where each event current hash binds the previous block digest:
  $$\text{Hash}_n = \text{SHA-256}(\text{Event}_n \,\|\, \text{Hash}_{n-1})$$
* Automated and manual audit chain integrity verification.

---

## 5. Quick Start (Turnkey Local Execution)

### Step 1: Clone and Setup Workspace
```bash
git clone <repo-url> drishti-x
cd drishti-x
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Seed Demonstration Environment
Generates clean and contaminated datasets, compiles demo ONNX and PyTorch models, creates initial inferences, and generates audit chains:
```bash
python scripts/seed_demo.py
```

### Step 5: Start Servers
**Terminal 1 (Backend - FastAPI):**
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend - Next.js):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## 6. Docker Deployment (Optional)

To start the complete platform with PostgreSQL, FastAPI backend, and Next.js frontend:
```bash
docker-compose up --build
```
* Frontend: `http://localhost:3000`
* Backend API & OpenAPI Docs: `http://localhost:8000/docs`
* PostgreSQL: `localhost:5432`

---

## 7. Role-Based Access Control (RBAC) Accounts

The system includes pre-configured defence accounts with different permissions:

| Call-Sign / Username | Role | Password | Operational Scope |
| :--- | :--- | :--- | :--- |
| `defence_commander` | `DEFENCE` | `Password123!` | Complete pipeline visibility, risk oversight & approvals |
| `lead_analyst` | `ANALYST` | `Password123!` | Integrity scans, quarantine workflow & assurance reports |
| `bharat_vendor` | `VENDOR` | `Password123!` | Model registry upload & verification reports |
| `field_contributor` | `CONTRIBUTOR` | `Password123!` | Reconnaissance dataset upload & own submissions |
| `cag_auditor` | `AUDITOR` | `Password123!` | Tamper-evident audit chain & compliance validation |

---

## 8. Judge / Evaluator Walkthrough Guide

DRISHTI-X is built so evaluators can test every major defence assurance capability locally:

1. **Login:** Go to `/login` and click **"Defence Commander"** or **"Lead Assurance Analyst"** for instant authentication.
2. **Dashboard (`/dashboard`):** Review the KPI cards, pipeline status, critical evidence feed, and cryptographic audit validity.
3. **Dataset Integrity (`/datasets`):**
   * Inspect `RADAR_EO_DUPLICATE_FLOODED` and `TACTICAL_ARMOR_TRIGGER_ANOMALY`.
   * Click **"ANALYZE"** to execute real perceptual hashing and backdoor pattern searches.
   * View the explainable **Contributor Source Risk** breakdown and sample inspection grid.
4. **Model Substitution & Fingerprint (`/models`):**
   * Inspect `SUSPECT_SURVEILLANCE_BACKBONE` flagged with **"SUBSTITUTION DETECTED"** (observed hash does not match expected baseline).
   * Click into details to inspect the 8-pattern reference battery behavioral fingerprint.
5. **Inference Provenance & Tamper Demonstration (`/inference`):**
   * Select a model, choose an image, and click **"RUN & SIGN INFERENCE"**.
   * Observe the generated SHA-256 bindings, nonce, sequence #, and Ed25519 signature.
   * Click **"TAMPER TEST"** on any record to maliciously alter the stored prediction label.
   * Click **"VERIFY"** and observe instant cryptographic detection with `INTEGRITY_FAILURE`!
   * Click **"REPLAY TEST"** and observe instant detection of nonce/sequence replay!
6. **Distribution Shift (`/shift-analysis`):**
   * Compare `SURVEILLANCE_EO_CLEAN_V1` against `HIGH_ALTITUDE_SNOW_DRIFT`.
   * Review the Wasserstein divergence and distinction between *Operational Drift* and *Suspicious Manipulation*.
7. **Analyst Governance & Quarantine Workflow:**
   * On any flagged asset, click **"DISPOSITION"** and select **"QUARANTINE"**.
   * Enter a formal justification reason and submit.
   * Notice the status updates immediately and an audit event is registered in the cryptographic chain.
8. **Assurance Report (`/reports`):**
   * Open any formal report to inspect the military-grade layout, Problem Statement ID: SIH26228, Indian Army branding, and coverage matrix.
   * Click **"VERIFY REPORT HASH"** to verify the SHA-256 integrity of the document.
   * Download the complete report as JSON or print to PDF.
9. **Tamper-Evident Audit Trail (`/audit`):**
   * Click **"VERIFY AUDIT CHAIN"** to confirm all chained SHA-256 blocks are valid.
   * Click **"SIMULATE AUDIT TAMPERING"** to inject a byte alteration into an earlier event.
   * Click **"VERIFY AUDIT CHAIN"** again to observe instant detection of the compromised block!

---

## 9. Reproducible Scenario Scripts

The `scripts/` directory provides standalone command-line tools for testing:
* `python scripts/inject_duplicate_samples.py` — Injects near-duplicate clones into a dataset.
* `python scripts/inject_label_anomaly.py` — Inverts annotation labels to simulate label poisoning.
* `python scripts/generate_ood_samples.py` — Produces synthetic out-of-distribution anomaly samples.
* `python scripts/create_model_fingerprint.py` — Evaluates model predictions across the reference battery.
* `python scripts/create_inference_record.py` — Generates a signed Ed25519 provenance record.
* `python scripts/tamper_inference_record.py` — Injects prediction alterations and verifies cryptographic detection.
* `python scripts/replay_inference_record.py` — Simulates nonce replay attacks.
* `python scripts/verify_audit_chain.py` — Verifies continuity of the cryptographic audit chain.

---

## 10. Unit Testing

Execute the automated test suite covering authentication, RBAC, cryptography, digital signatures, audit chain integrity, and risk aggregation:
```bash
python -m pytest tests/test_drishti_assurance.py -v
```

---

## 11. Assurance Coverage & Limitations

| Vector | Coverage | Limitations / Boundary |
| :--- | :--- | :--- |
| Dataset Integrity | `SUPPORTED` | Detects rigid spatial patterns, duplicates, and centroid skew. Imperceptible clean-label perturbation requires formal training-time bounds. |
| Model Integrity | `SUPPORTED` | Detects binary substitution, version divergence, and activation drift on reference batteries. White-box weight inversion is required for latent trojan verification. |
| Inference Provenance | `SUPPORTED` | Bit-exact cryptographic verification of outputs and parameters via Ed25519. Guarantees provenance; does not measure tactical ground truth. |
| Distribution Shift | `SUPPORTED` | Wasserstein metric on color-texture moments. Specialized radar or hyperspectral sensors require custom spectral band adapters. |
| Audit Trail | `SUPPORTED` | Cryptographic SHA-256 chain guarantees detection of retroactive log alterations. |
| Zero-Day Attacks | `NOT COVERED` | Unmodeled threats outside defined statistical and cryptographic models require human red-teaming. |

---

## 12. Ministry of Defence Attribution

Developed in response to **Problem Statement ID: SIH26228**, Ministry of Defence / Indian Army / DGIS.  
Designed for secure, air-gapped deployment on local edge processing nodes and mission control workstations.
