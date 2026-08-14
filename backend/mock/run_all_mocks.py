import sys
import os
from sqlalchemy import text

# Add parent directory to sys.path so app imports work seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models import user, company, job, candidate, application, offer, interview, job_distribution, rbac
from mock.level1_users_and_candidates import seed_users_and_candidates
from mock.level2_jobs import seed_jobs
from mock.level3_applications_and_slots import seed_applications_and_slots
from mock.level4_interviews import seed_interviews
from mock.level5_offers import seed_offers

def reset_database():
    """Wipes all database tables cleanly using CASCADE before re-creating schema."""
    print("🧹 Clearing database tables cleanly with SQL CASCADE...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS user_job_scopes CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS role_permissions CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS roles CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS permissions CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS job_distributions CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS offer_approvals CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS offers CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS gmail_accounts CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS offer_templates CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS interview_feedback CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS interview_interviewers CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS interviews CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS interviews_v2 CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS interview_slots CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS final_scores CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS candidate_requisitions CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS application_screenings CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS applications CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS jobs CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS candidates CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS companies CASCADE;"))
        conn.commit()

    Base.metadata.create_all(bind=engine)
    print("  ✓ Database tables reset and recreated clean!")

def run_all():
    print("🚀 Starting Clean 5-Level Database Mock Generation...")
    
    # 1. Clear database tables
    reset_database()

    # 2. Seed all 5 levels sequentially
    db = SessionLocal()
    try:
        # Level 1: Users & Candidates
        users_context = seed_users_and_candidates(db)

        # Level 2: Jobs & UserJobScopes
        jobs = seed_jobs(db, users_context=users_context)

        # Level 3: Applications across ALL stages & Slots
        applications = seed_applications_and_slots(db, users_context=users_context, jobs=jobs)

        # Level 4: Interviews & Multi-Interviewer Feedback
        interviews = seed_interviews(db, users_context=users_context, applications=applications)

        # Level 5: Offers & Approvals
        offers = seed_offers(db, users_context=users_context, applications=applications, jobs=jobs)

        print("\n✨ Success! Database wiped and all 5 levels generated cleanly!")

    except Exception as err:
        print(f"❌ Error during mock generation: {err}")
        db.rollback()
        raise err
    finally:
        db.close()

if __name__ == "__main__":
    run_all()
