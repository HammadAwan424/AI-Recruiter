from enum import Enum
from typing import List, Dict, Set


class Permission(str, Enum):
    # Global / Superadmin
    ALL = "*"
    SUPERADMIN = "superadmin"

    # User Management
    USER_VIEW = "user:view"
    USER_INVITE = "user:invite"
    USER_DEACTIVATE = "user:deactivate"
    USER_CHANGE_PERMISSIONS = "user:change_permissions"

    # Job Requisitions
    JOB_CREATE = "job:create"
    JOB_VIEW = "job:view"
    JOB_APPROVE = "job:approve"
    JOB_CLOSE = "job:close"
    JOB_ASSIGN_RECRUITER = "job:assign_recruiter"

    # Candidate Management
    CANDIDATE_VIEW = "candidate:view"
    CANDIDATE_VIEW_COMPENSATION = "candidate:view_compensation"
    CANDIDATE_DISPOSITION = "candidate:disposition"

    # Interview Management
    INTERVIEW_CREATE = "interview:create"
    INTERVIEW_ASSIGN = "interview:assign"
    INTERVIEW_RESCHEDULE = "interview:reschedule"
    INTERVIEW_SUBMIT_FEEDBACK = "interview:submit_feedback"

    # Offer Management
    OFFER_GENERATE = "offer:generate"
    OFFER_VIEW = "offer:view"
    OFFER_APPROVE = "offer:approve"

    # Profile Management
    PROFILE_UPDATE = "profile:update"


ALL_PERMISSIONS: Set[str] = {p.value for p in Permission}

# Centralized Role -> Permissions Mapping with Clean Domain Prefixes
DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "ceo": [
        "user:",
        "job:",
        "candidate:",
        "interview:",
        "offer:",
        Permission.PROFILE_UPDATE.value,
    ],
    "recruiter": [
        Permission.JOB_CREATE.value,
        Permission.JOB_CLOSE.value,
        Permission.JOB_ASSIGN_RECRUITER.value,
        Permission.JOB_VIEW.value,
        "candidate:",
        "interview:",
        Permission.OFFER_GENERATE.value,
        Permission.OFFER_VIEW.value,
        Permission.PROFILE_UPDATE.value,
    ],
    "hiring_manager": [
        Permission.JOB_VIEW.value,
        Permission.CANDIDATE_DISPOSITION.value,
        Permission.CANDIDATE_VIEW.value,
        "interview:",
        "offer:",
        Permission.PROFILE_UPDATE.value,
    ],
    "interviewer": [
        Permission.JOB_VIEW.value,
        Permission.CANDIDATE_VIEW.value,
        Permission.INTERVIEW_SUBMIT_FEEDBACK.value,
        Permission.PROFILE_UPDATE.value,
    ],
}


def normalize_permissions(permission_keys: List[str]) -> List[str]:
    """
    Normalizes a list of permission keys for direct prefix matching:
    1. If '*' is present, returns ['*'].
    2. Groups permissions by domain. If a domain prefix (e.g. 'user:' or 'user:*') is present
       OR if all sub-permissions of a domain are present, collapses to 'domain:' (e.g. 'user:').
    3. Removes redundant sub-permissions when a domain prefix is active.
    """
    keys_set = set(permission_keys)
    if "*" in keys_set:
        return ["*"]

    # Known domain sub-permissions map
    domain_sub_permissions: Dict[str, Set[str]] = {}
    for p in Permission:
        if ":" in p.value:
            domain, _ = p.value.split(":", 1)
            if domain not in domain_sub_permissions:
                domain_sub_permissions[domain] = set()
            domain_sub_permissions[domain].add(p.value)

    normalized: Set[str] = set()
    domain_prefixes: Set[str] = set()

    # Identify explicitly passed wildcards or domain prefixes (e.g. 'user:' or 'user:*')
    for key in keys_set:
        if key.endswith(":") or key.endswith("*"):
            domain = key.rstrip(":*")
            domain_prefixes.add(domain)

    # Check if all sub-permissions of a domain are present
    for domain, sub_keys in domain_sub_permissions.items():
        if sub_keys.issubset(keys_set):
            domain_prefixes.add(domain)

    for key in keys_set:
        if ":" in key:
            domain, _ = key.split(":", 1)
            if domain in domain_prefixes:
                normalized.add(f"{domain}:")
            else:
                normalized.add(key)
        else:
            normalized.add(key)

    return sorted(list(normalized))
