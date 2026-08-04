from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.candidate import Candidate
from app.models.rbac import Role, RolePermission
from app.utils.security import hash_password
from app.utils.security_seeder import seed_default_roles, DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLES


def seed_users_and_candidates(db):
    print("🔹 [Level 1] Generating Root Company, RBAC Users & Candidates...")

    # 1. Company
    company = db.query(Company).filter(Company.name == "AI Recruiter").first()
    if not company:
        company = Company(name="AI Recruiter")
        db.add(company)
        db.commit()
        db.refresh(company)

    # 2. Seed Default Company Roles via Security Seeder
    seed_default_roles(
        db,
        company_id=company.id,
        roles_list=DEFAULT_ROLES,
        role_permissions_map=DEFAULT_ROLE_PERMISSIONS
    )

    # Seed Platform Superadmin Role (Company-independent) for mock testing
    superadmin_role = db.query(Role).filter(Role.name == "superadmin", Role.company_id.is_(None)).first()
    if not superadmin_role:
        superadmin_role = Role(name="superadmin", description="Platform Super Admin Role", job_scope="all", company_id=None)
        db.add(superadmin_role)
        db.flush()
        db.add(RolePermission(role_id=superadmin_role.id, permission_key="superadmin"))
        db.add(RolePermission(role_id=superadmin_role.id, permission_key="*"))
        db.commit()

    # 3. Users Across All Roles
    admin = db.query(User).filter(User.email == "admin@airecruiter.com").first()
    if not admin:
        admin = User(
            full_name="Super Admin",
            email="admin@airecruiter.com",
            password=hash_password("admin123"),
            role="superadmin",
            status="active"
        )
        db.add(admin)
        db.commit()

    ceo = db.query(User).filter(User.email == "ceo@airecruiter.com").first()
    if not ceo:
        ceo = User(
            full_name="Sarah Jenkins (CEO)",
            email="ceo@airecruiter.com",
            password=hash_password("ceo123"),
            role="ceo",
            company_id=company.id,
            status="active"
        )
        db.add(ceo)
        db.commit()

    recruiter = db.query(User).filter(User.email == "recruiter@airecruiter.com").first()
    if not recruiter:
        recruiter = User(
            full_name="Rachel Vance (Lead Recruiter)",
            email="recruiter@airecruiter.com",
            password=hash_password("recruiter123"),
            role="recruiter",
            company_id=company.id,
            status="active"
        )
        db.add(recruiter)
        db.commit()

    hm = db.query(User).filter(User.email == "hm@airecruiter.com").first()
    if not hm:
        hm = User(
            full_name="Henry Miller (Hiring Manager)",
            email="hm@airecruiter.com",
            password=hash_password("hm123"),
            role="hiring_manager",
            company_id=company.id,
            status="active"
        )
        db.add(hm)
        db.commit()

    interviewer = db.query(User).filter(User.email == "interviewer@airecruiter.com").first()
    if not interviewer:
        interviewer = User(
            full_name="Ian Thorne (Lead Tech Interviewer)",
            email="interviewer@airecruiter.com",
            password=hash_password("interviewer123"),
            role="interviewer",
            company_id=company.id,
            status="active"
        )
        db.add(interviewer)
        db.commit()
    db.refresh(admin)
    db.refresh(ceo)
    db.refresh(recruiter)
    db.refresh(hm)
    db.refresh(interviewer)

    # 4. Candidates Across All Stages
    candidate_data = [
        ("Alex Johnson", "alex.j@example.com", "+1 (555) 234-5678"),
        ("Sophia Chen", "sophia.c@example.com", "+1 (555) 876-5432"),
        ("Marcus Vance", "marcus.v@example.com", "+1 (555) 432-1098"),
        ("Elena Rostova", "elena.r@example.com", "+1 (555) 999-8877"),
        ("David Kim", "david.k@example.com", "+1 (555) 111-2233"),
        ("Olivia Taylor", "olivia.t@example.com", "+1 (555) 444-5566"),
        ("Lucas Wright", "lucas.w@example.com", "+1 (555) 777-8899")
    ]

    candidates = []
    for name, email, phone in candidate_data:
        cand = db.query(Candidate).filter(Candidate.email == email).first()
        if not cand:
            cand = Candidate(
                full_name=name,
                email=email,
                phone=phone
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)
        candidates.append(cand)

    print(f"  ✓ Level 1 Complete: 1 Company ('{company.name}'), 5 Users (Admin, CEO, Recruiter, HM, Interviewer), {len(candidates)} Candidates.")
    return {
        "admin": admin,
        "ceo": ceo,
        "recruiter": recruiter,
        "hm": hm,
        "interviewer": interviewer,
        "candidates": candidates,
        "company": company
    }
