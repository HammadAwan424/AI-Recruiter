from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.rbac import Role, RolePermission

DEFAULT_ROLES = [
    {
        "name": "superadmin",
        "description": "Super Administrator with platform multi-tenant control"
    },
    {
        "name": "ceo",
        "description": "Chief Executive Officer with full organization control"
    },
    {
        "name": "recruiter",
        "description": "Recruiter managing company-wide job candidates and pipeline"
    },
    {
        "name": "hiring_manager",
        "description": "Hiring Manager managing assigned scoped jobs and candidate interviewers"
    },
    {
        "name": "interviewer",
        "description": "Interviewer conducting assigned candidate interviews and submitting feedback"
    }
]

DEFAULT_ROLE_PERMISSIONS = {
    "superadmin": [
        "superadmin"
    ],
    "ceo": [
        "change_permissions", "view_compensation", "disposition_candidate",
        "create_requisition", "approve_requisition", "create_offer",
        "create_interview", "take_interview"
    ],
    "recruiter": [
        "view_compensation", "disposition_candidate", "create_requisition",
        "create_offer", "create_interview", "take_interview"
    ],
    "hiring_manager": [
        "disposition_candidate", "create_offer", "create_interview",
        "take_interview"
    ],
    "interviewer": [
        "take_interview"
    ]
}


def seed_default_roles(
    db: Session,
    company_id: int,
    roles_list: Optional[List[Dict[str, str]]] = None,
    role_permissions_map: Optional[Dict[str, List[str]]] = None
):
    """
    Utility function that seeds default roles and permissions for a specific company_id.
    Requires a valid company_id. Does not seed global defaults.
    """
    if not company_id:
        raise ValueError("seed_default_roles requires a valid company_id")

    target_roles = roles_list or DEFAULT_ROLES
    target_permissions = role_permissions_map or DEFAULT_ROLE_PERMISSIONS

    role_map = {}
    for r_data in target_roles:
        role = db.query(Role).filter(
            Role.name == r_data["name"],
            Role.company_id == company_id
        ).first()

        if not role:
            role = Role(
                name=r_data["name"],
                company_id=company_id,
                description=r_data["description"]
            )
            db.add(role)
            db.commit()
            db.refresh(role)
        role_map[role.name] = role

    # Seed RolePermission Mappings
    for role_name, perm_keys in target_permissions.items():
        role = role_map.get(role_name)
        if not role:
            continue

        for perm_key in perm_keys:
            existing_mapping = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.permission_key == perm_key
            ).first()

            if not existing_mapping:
                rp = RolePermission(
                    role_id=role.id,
                    permission_key=perm_key
                )
                db.add(rp)

    db.commit()
    print(f"  ✓ Default Roles & Permissions seeded cleanly for company_id={company_id}!")
    return role_map
