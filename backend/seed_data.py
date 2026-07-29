import sys
import os
from datetime import datetime, date, time, timedelta

from app.database import SessionLocal, engine
from app.models.user import User
from app.models.recruitment import Job, Candidate, Application
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.models.interview import InterviewModel, InterviewSlot
from app.utils.security import hash_password
from app.utils.offer_crypto import generate_secure_offer_token, compute_offer_audit_hash

def seed_database():
    db = SessionLocal()
    print("🌱 Seeding realistic test data into PostgreSQL...")

    # 1. Create CEO & HR Users if not exist
    ceo = db.query(User).filter(User.role == "ceo").first()
    if not ceo:
        ceo = User(
            full_name="Sarah Jenkins (CEO)",
            email="ceo@agentra.com",
            password=hash_password("ceo123"),
            role="ceo",
            status="approved"
        )
        db.add(ceo)
        db.commit()
        db.refresh(ceo)
        print("  ✓ Created CEO user: ceo@agentra.com / ceo123")

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
        db.refresh(hr)
        print("  ✓ Created HR user: hr@agentra.com / hr123")

    # 2. Create Jobs
    if db.query(Job).count() == 0:
        job1 = Job(
            ceo_id=ceo.id,
            company_name="Agentra AI",
            title="Senior Full Stack Engineer",
            department="Engineering",
            employment_type="Full-Time",
            experience="5+ Years",
            skills="React, Node.js, Python, PostgreSQL, TypeScript",
            salary_range="$120,000 - $150,000",
            full_description="We are seeking an experienced Full Stack Engineer to lead web application architecture.",
            keywords="React, FastAPI, PostgreSQL",
            status="published"
        )
        job2 = Job(
            ceo_id=ceo.id,
            company_name="Agentra AI",
            title="AI / ML Engineer",
            department="Artificial Intelligence",
            employment_type="Full-Time",
            experience="3+ Years",
            skills="PyTorch, LangChain, Transformers, Python, RAG",
            salary_range="$130,000 - $160,000",
            full_description="Building cutting-edge AI recruiter agentic workflows and LLM pipelines.",
            keywords="PyTorch, LLM, LangChain",
            status="published"
        )
        db.add_all([job1, job2])
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        print("  ✓ Created 2 Job Postings")

        # 3. Create Candidates
        c1 = Candidate(full_name="Alex Johnson", email="alex.j@example.com", phone="+1 (555) 234-5678", cv_text="Experienced Full Stack Developer with 6 years building React and Python backend microservices.")
        c2 = Candidate(full_name="Sophia Chen", email="sophia.c@example.com", phone="+1 (555) 876-5432", cv_text="AI Research Engineer specialized in PyTorch, NLP, and RAG pipelines.")
        c3 = Candidate(full_name="Marcus Vance", email="marcus.v@example.com", phone="+1 (555) 432-1098", cv_text="Senior React Frontend Architect with UI UX focus.")
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)
        print("  ✓ Created 3 Candidates")

        # 4. Create Applications
        app1 = Application(candidate_id=c1.id, job_id=job1.id, status="interview_scheduled", match_score=94.5, skill_gap="GraphQL", summary="Top candidate with strong full stack background.")
        app2 = Application(candidate_id=c2.id, job_id=job2.id, status="offer_sent", match_score=91.0, skill_gap="Kubernetes", summary="Exceptional AI engineering portfolio.")
        app3 = Application(candidate_id=c3.id, job_id=job1.id, status="shortlisted", match_score=83.0, skill_gap="Python Backend", summary="Strong frontend React candidate.")
        db.add_all([app1, app2, app3])
        db.commit()
        db.refresh(app1)
        db.refresh(app2)
        db.refresh(app3)
        print("  ✓ Created 3 Candidate Applications")

        # 5. Create Interview Availability Slots & Scheduled Interviews
        slot1 = InterviewSlot(interviewer_id=ceo.id, job_id=job1.id, slot_date=date.today() + timedelta(days=1), start_time=time(10, 0), end_time=time(11, 0), is_booked=True)
        slot2 = InterviewSlot(interviewer_id=ceo.id, job_id=0, slot_date=date.today() + timedelta(days=2), start_time=time(14, 0), end_time=time(15, 0), is_booked=False)
        db.add_all([slot1, slot2])
        
        interview1 = InterviewModel(
            application_id=app1.id,
            candidate_id=c1.id,
            job_id=job1.id,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_time=time(10, 0),
            duration_minutes=45,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-TEST1234",
            interviewer_1=ceo.full_name,
            interviewer_2=hr.full_name,
            status="SCHEDULED"
        )
        db.add(interview1)
        db.commit()
        print("  ✓ Created Interview Slots & Scheduled Interview")

        # 6. Create Offer Templates & Active Offers
        tmpl = OfferTemplate(title="Standard Full-Time Offer", department="GLOBAL", content="Dear {{candidate_name}},\n\nWe are excited to offer you the position of {{job_title}} at {{company_name}}.", is_active=True)
        db.add(tmpl)
        
        token = generate_secure_offer_token()
        offer1 = Offer(
            application_id=app2.id,
            candidate_id=c2.id,
            job_id=job2.id,
            created_by_user_id=ceo.id,
            job_title=job2.title,
            department=job2.department,
            base_salary=145000.0,
            bonus_equity="10% Annual Bonus + 5,000 Options",
            start_date=date.today() + timedelta(days=14),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text=f"Dear Sophia Chen,\n\nWe are thrilled to offer you the position of AI / ML Engineer at Agentra AI with a base salary of $145,000.",
            status="SENT",
            secure_token=token,
            token_expires_at=datetime.utcnow() + timedelta(days=7)
        )
        offer2 = Offer(
            application_id=app3.id,
            candidate_id=c3.id,
            job_id=job1.id,
            created_by_user_id=ceo.id,
            job_title=job1.title,
            department=job1.department,
            base_salary=135000.0,
            bonus_equity="15% Performance Bonus + 2,500 Options",
            start_date=date.today() + timedelta(days=21),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text=f"Dear Marcus Vance,\n\nWe are pleased to offer you the position of Senior Full Stack Engineer.",
            status="PENDING_APPROVAL"
        )
        db.add_all([offer1, offer2])
        db.commit()
        db.refresh(offer2)

        appr2 = OfferApproval(offer_id=offer2.id, approver_id=ceo.id, step_order=1, status="PENDING")
        db.add(appr2)
        db.commit()
        print("  ✓ Created Offer Templates, Sent Offer & Pending Approval Offers")
        print(f"\n🎉 Candidate Offer Signing Test Link:\n   http://localhost:5173/offer/sign/{token}\n")

    db.close()
    print("✅ Seed completed successfully! Database now populated.")

if __name__ == "__main__":
    seed_database()
