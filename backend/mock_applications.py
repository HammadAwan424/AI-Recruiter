import random
from app.database import SessionLocal
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application

def create_mock_applications(count: int = 5):
    db = SessionLocal()
    jobs = db.query(Job).all()
    if not jobs:
        print("❌ No jobs found! Please create or seed jobs first.")
        db.close()
        return

    print(f"🌱 Generating {count} realistic mock applications...")

    names = [
        ("Liam Gallagher", "liam.g@example.com", "+1 (555) 111-2233"),
        ("Aisha Patel", "aisha.p@example.com", "+1 (555) 222-3344"),
        ("Carlos Mendez", "carlos.m@example.com", "+1 (555) 333-4455"),
        ("Zoe Washington", "zoe.w@example.com", "+1 (555) 444-5566"),
        ("Tariq Al-Mansoor", "tariq.a@example.com", "+1 (555) 555-6677"),
        ("Emily Watson", "emily.w@example.com", "+1 (555) 666-7788"),
        ("David Kim", "david.k@example.com", "+1 (555) 777-8899")
    ]

    statuses = ["applied", "screening", "interview", "hired", "rejected"]
    summaries = [
        "Strong engineering background with solid experience in cloud microservices.",
        "Experienced full stack developer with great communication and problem solving skills.",
        "Passionate AI research engineer with published papers and hands-on PyTorch experience.",
        "Talented UI/UX designer with extensive experience in React component design systems.",
        "Backend specialist proficient in PostgreSQL optimization and async FastAPI architecture."
    ]

    created = 0
    for name, email, phone in names[:count]:
        existing = db.query(Candidate).filter(Candidate.email == email).first()
        if not existing:
            cand = Candidate(
                full_name=name,
                email=email,
                phone=phone
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)
        else:
            cand = existing

        job = random.choice(jobs)
        app_exists = db.query(Application).filter(
            Application.candidate_id == cand.id,
            Application.job_id == job.id
        ).first()

        if not app_exists:
            status = random.choice(statuses)
            score = round(random.uniform(75.0, 98.0), 1)
            app = Application(
                candidate_id=cand.id,
                job_id=job.id,
                current_status=status,
                disposition="active" if status != "rejected" else "rejected",
                match_score=score,
                skill_gap=random.choice(["GraphQL", "Kubernetes", "Redis", "None"]),
                summary=random.choice(summaries)
            )
            db.add(app)
            db.commit()
            created += 1
            print(f"  ✓ Created application: {cand.full_name} for '{job.title}' (Status: {status}, Score: {score}%)")

    db.close()
    print(f"✅ Generated {created} new mock candidate applications!")

if __name__ == "__main__":
    create_mock_applications(5)
