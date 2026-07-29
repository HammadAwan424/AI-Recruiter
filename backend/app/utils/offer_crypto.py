import hashlib
import json
import secrets
from datetime import datetime, date


def generate_secure_offer_token() -> str:
    """Generate a random 48-character URL-safe secure token."""
    return secrets.token_urlsafe(32)


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def compute_offer_audit_hash(
    offer_id: int,
    candidate_email: str,
    job_title: str,
    base_salary: float,
    start_date: str,
    signer_name: str,
    signer_ip: str,
    signed_at: str,
    signature_data: str
) -> str:
    """
    Computes a canonical SHA-256 cryptographic hash of the offer & e-signature audit payload.
    Sorts dictionary keys to guarantee byte-level consistency regardless of key insertion order.
    """
    audit_payload = {
        "offer_id": offer_id,
        "candidate_email": candidate_email,
        "job_title": job_title,
        "base_salary": float(base_salary),
        "start_date": str(start_date),
        "signer_name": signer_name,
        "signer_ip": signer_ip,
        "signed_at": str(signed_at),
        "signature_hash": hashlib.sha256(signature_data.encode("utf-8")).hexdigest()
    }

    # Convert to canonical JSON string with sorted keys
    canonical_json = json.dumps(audit_payload, sort_keys=True, default=json_serial)

    # Compute SHA-256 hash digest
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
