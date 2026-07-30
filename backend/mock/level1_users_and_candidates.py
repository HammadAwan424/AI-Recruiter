from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.candidate import Candidate
from app.utils.security import hash_password

def seed_users_and_candidates(db):
    print("🔹 [Level 1] Generating Root Company, Users & Candidates...")

    # 1. Company
    company = db.query(Company).filter(Company.name == "Agentra AI").first()
    if not company:
        company = Company(name="Agentra AI")
        db.add(company)
        db.commit()
        db.refresh(company)

    # 2. Users
    admin = db.query(User).filter(User.role == "superadmin").first()
    if not admin:
        admin = User(
            full_name="System Admin",
            email="admin@agentra.com",
            password=hash_password("admin123"),
            role="superadmin",
            status="approved"
        )
        db.add(admin)

    ceo = db.query(User).filter(User.role == "ceo").first()
    if not ceo:
        ceo = User(
            full_name="Sarah Jenkins (CEO)",
            email="ceo@agentra.com",
            password=hash_password("ceo123"),
            role="ceo",
            company_id=company.id,
            status="approved"
        )
        db.add(ceo)
    elif not ceo.company_id:
        ceo.company_id = company.id

    hr = db.query(User).filter(User.email == "hr@agentra.com").first()
    if not hr:
        hr = User(
            full_name="David Miller (HR Head)",
            email="hr@agentra.com",
            password=hash_password("hr123"),
            role="employee",
            company_id=company.id,
            status="active"
        )
        db.add(hr)
    elif not hr.company_id:
        hr.company_id = company.id

    db.commit()
    db.refresh(admin)
    db.refresh(ceo)
    db.refresh(hr)

    # 3. Candidates
    candidate_data = [
        ("Alex Johnson", "alex.j@example.com", "+1 (555) 234-5678", "Senior Full Stack Engineer resume with React & Python."),
        ("Sophia Chen", "sophia.c@example.com", "+1 (555) 876-5432", "AI Engineer with PyTorch, NLP, and RAG expertise."),
        ("Marcus Vance", "marcus.v@example.com", "+1 (555) 432-1098", "Frontend React Specialist with UI UX experience."),
        ("Elena Rostova", "elena.r@example.com", "+1 (555) 999-8877", "Senior ML Researcher with LangChain and vector DB experience.")
    ]

    candidates = []
    for name, email, phone, cv in candidate_data:
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

    print(f"  ✓ Level 1 Complete: 1 Company ('{company.name}'), 3 Users (Admin, CEO, HR), {len(candidates)} Candidates created.")
    return admin, ceo, hr, candidates
