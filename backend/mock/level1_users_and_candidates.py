from datetime import datetime, timedelta
from app.models.company import Company
from app.models.gmail_account import GmailAccount
from app.models.user import User
from app.models.candidate import Candidate
from app.models.rbac import Role, RolePermission
from app.utils.security import hash_password
from app.utils.security_seeder import seed_default_roles, DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLES


def seed_users_and_candidates(db):
    print("🔹 [Level 1] Generating Root Company, Gmail Mailbox, RBAC Users & Candidates (Batched)...")

    # 1. Company
    company = Company(name="AI Recruiter")
    db.add(company)
    db.flush()

    # 2. Company Gmail Mailbox
    gmail_account = GmailAccount(
        company_id=company.id,
        email="recruitment@airecruiter.com",
        provider="gmail",
        is_active=True,
        last_read=datetime.utcnow() - timedelta(days=3),
    )
    db.add(gmail_account)

    # 3. Seed Default Company Roles via Security Seeder
    seed_default_roles(
        db,
        company_id=company.id,
        roles_list=DEFAULT_ROLES,
        role_permissions_map=DEFAULT_ROLE_PERMISSIONS,
    )

    # Seed Platform Superadmin Role (Company-independent)
    superadmin_role = Role(
        name="superadmin",
        description="Platform Super Admin Role",
        job_scope="all",
        company_id=None,
    )
    db.add(superadmin_role)
    db.flush()
    db.add(RolePermission(role_id=superadmin_role.id, permission_key="superadmin"))
    db.add(RolePermission(role_id=superadmin_role.id, permission_key="*"))

    # 4. Users Across All Roles
    admin = User(
        full_name="Super Admin",
        email="admin@airecruiter.com",
        password=hash_password("admin123"),
        role="superadmin",
        status="active",
    )
    ceo = User(
        full_name="Sarah Jenkins (CEO)",
        email="ceo@airecruiter.com",
        password=hash_password("ceo123"),
        role="ceo",
        company_id=company.id,
        status="active",
    )
    recruiter = User(
        full_name="Rachel Vance (Lead Recruiter)",
        email="recruiter@airecruiter.com",
        password=hash_password("recruiter123"),
        role="recruiter",
        company_id=company.id,
        status="active",
    )
    hm = User(
        full_name="Henry Miller (Hiring Manager)",
        email="hm@airecruiter.com",
        password=hash_password("hm123"),
        role="hiring_manager",
        company_id=company.id,
        status="active",
    )
    interviewer = User(
        full_name="Ian Thorne (Lead Tech Interviewer)",
        email="interviewer@airecruiter.com",
        password=hash_password("interviewer123"),
        role="interviewer",
        company_id=company.id,
        status="active",
    )
    db.add_all([admin, ceo, recruiter, hm, interviewer])

    # 5. Candidates (14 Candidates - 7 for Job 1, 7 for Job 2)
    candidate_data = [
        # Job 1 Candidates
        ("Alex Johnson", "alex.j@example.com", "+1 (555) 234-5678"),
        ("Sophia Chen", "sophia.c@example.com", "+1 (555) 876-5432"),
        ("Marcus Vance", "marcus.v@example.com", "+1 (555) 432-1098"),
        ("Elena Rostova", "elena.r@example.com", "+1 (555) 999-8877"),
        ("David Kim", "david.k@example.com", "+1 (555) 111-2233"),
        ("Olivia Taylor", "olivia.t@example.com", "+1 (555) 444-5566"),
        ("Lucas Wright", "lucas.w@example.com", "+1 (555) 777-8899"),

        # Job 2 Candidates
        ("Nathan Drake", "nathan.d@example.com", "+1 (555) 333-1111"),
        ("Hannah Abbott", "hannah.a@example.com", "+1 (555) 333-2222"),
        ("Benjamin Foster", "benjamin.f@example.com", "+1 (555) 333-3333"),
        ("Chloe Sterling", "chloe.s@example.com", "+1 (555) 333-4444"),
        ("Gabriel Ramos", "gabriel.r@example.com", "+1 (555) 333-5555"),
        ("Victoria Thorne", "victoria.t@example.com", "+1 (555) 333-6666"),
        ("Sebastian Cross", "sebastian.c@example.com", "+1 (555) 333-7777"),
    ]

    candidates = [
        Candidate(
            company_id=company.id,
            full_name=name,
            email=email,
            normalized_email=email.strip().lower(),
            phone=phone,
        )
        for name, email, phone in candidate_data
    ]
    db.add_all(candidates)
    db.commit()

    print(
        f"  ✓ Level 1 Complete: 1 Company ('{company.name}'), 1 Mailbox ('{gmail_account.email}'), "
        f"5 Users (Admin, CEO, Recruiter, HM, Interviewer), {len(candidates)} Candidates."
    )
    return {
        "admin": admin,
        "ceo": ceo,
        "recruiter": recruiter,
        "hm": hm,
        "interviewer": interviewer,
        "candidates": candidates,
        "company": company,
        "gmail_account": gmail_account,
    }
