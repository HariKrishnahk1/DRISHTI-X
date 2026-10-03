import hashlib
import json
import os
import time
import secrets
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Persistent Edge Key for Air-gapped Hardware / Local Assured Environment
KEY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".keys")
os.makedirs(KEY_DIR, exist_ok=True)
PRIV_KEY_PATH = os.path.join(KEY_DIR, "ed25519_private.pem")
PUB_KEY_PATH = os.path.join(KEY_DIR, "ed25519_public.pem")

def get_or_create_keypair() -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
    if os.path.exists(PRIV_KEY_PATH) and os.path.exists(PUB_KEY_PATH):
        with open(PRIV_KEY_PATH, "rb") as f:
            private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUB_KEY_PATH, "rb") as f:
            public_key = serialization.load_pem_public_key(f.read())
        return private_key, public_key
    
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    with open(PRIV_KEY_PATH, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    with open(PUB_KEY_PATH, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))
    return private_key, public_key

def calculate_sha256_file(file_path: str) -> str:
    sha256 = hashlib.sha256()
    if os.path.isdir(file_path):
        for root, dirs, files in os.walk(file_path):
            dirs.sort()
            for fname in sorted(files):
                fpath = os.path.join(root, fname)
                sha256.update(fname.encode('utf-8'))
                try:
                    with open(fpath, "rb") as f:
                        for chunk in iter(lambda: f.read(65536), b""):
                            sha256.update(chunk)
                except Exception:
                    pass
        return sha256.hexdigest()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def calculate_sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def calculate_canonical_json_hash(data: Dict[str, Any]) -> str:
    # Sort keys for deterministic hash
    canonical = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(canonical).hexdigest()

def sign_provenance_payload(payload: Dict[str, Any]) -> Tuple[str, str, str]:
    """
    Cryptographically signs the bound provenance payload using Ed25519.
    Payload binds: input_hash, model_hash, config_hash, output_hash, timestamp, nonce, sequence
    """
    private_key, _ = get_or_create_keypair()
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
    signature_bytes = private_key.sign(canonical)
    signature_hex = signature_bytes.hex()
    return signature_hex, "Ed25519-SHA256", "DRISHTI-X-AIRGAP-KEY-001"

def verify_provenance_signature(payload: Dict[str, Any], signature_hex: str) -> bool:
    """
    Verifies that the signature matches the canonical payload.
    """
    try:
        _, public_key = get_or_create_keypair()
        canonical = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        signature_bytes = bytes.fromhex(signature_hex)
        public_key.verify(signature_bytes, canonical)
        return True
    except Exception:
        return False

def generate_nonce() -> str:
    return secrets.token_hex(16)
