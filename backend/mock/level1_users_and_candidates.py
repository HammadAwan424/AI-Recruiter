from app.database import SessionLocal
from app.models.user import User
from app.models.recruitment import Candidate
from app.utils.security import hash_password

def seed_users_and_candidates(db):
    print("🔹 [Level 1] Generating Root Users & Candidates...")

    # 1. Users
    ceo = db.query(User).filter(User.role == "ceo").first()
    if not ceo:
        ceo = User(
            full_name="Sarah Jenkins (CEO)",
            email="ceo@agentra.com",
            password=hash_password("ceo123"),
            role="ceo",
            company_name="Agentra AI",
            status="approved"
        )
        db.add(ceo)

    hr = db.query(User).filter(User.email == "hr@agentra.com").first()
    if not hr:
        hr = User(
            full_name="David Miller (HR Head)",
            email="hr@agentra.com",
            password=hash_password("hr123"),
            role="employee",
            status="active"
        )
        db.add(hr)

    db.commit()
    db.refresh(ceo)
    db.refresh(hr)

    # 2. Candidates
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
                phone=phone,
                cv_text=cv,
                cv_filename=f"{name.lower().replace(' ', '_')}_resume.pdf"
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)
        candidates.append(cand)

    print(f"  ✓ Level 1 Complete: {2} Users, {len(candidates)} Candidates created.")
    return ceo, hr, candidates
