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
    """Wipes all database tables cleanly in a SINGLE batch SQL CASCADE command."""
    print("🧹 Clearing database tables cleanly in a single SQL CASCADE batch...")
    tables_to_drop = [
        "user_job_scopes",
        "role_permissions",
        "roles",
        "permissions",
        "job_distributions",
        "offer_approvals",
        "offers",
        "gmail_accounts",
        "offer_templates",
        "interview_feedback",
        "interview_interviewers",
        "interviews",
        "interviews_v2",
        "interview_slots",
        "final_scores",
        "candidate_requisitions",
        "application_screenings",
        "applications",
        "jobs",
        "candidates",
        "users",
        "companies",
    ]
    with engine.begin() as conn:
        conn.execute(text(f"DROP TABLE IF EXISTS {', '.join(tables_to_drop)} CASCADE;"))

    Base.metadata.create_all(bind=engine)
    print("  ✓ Database tables reset and recreated clean in 1 roundtrip!")

def run_all():
    print("🚀 Starting Clean 5-Level Database Mock Generation (High-Performance Batched)...")
    
    # 1. Clear database tables in a single batch
    reset_database()

    # 2. Seed all 5 levels with batched transactions
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
