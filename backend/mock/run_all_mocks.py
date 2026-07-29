import sys
import os

# Add parent directory to sys.path so app imports work seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models import user, recruitment, offer, interview
from mock.level1_users_and_candidates import seed_users_and_candidates
from mock.level2_jobs import seed_jobs
from mock.level3_applications_and_slots import seed_applications_and_slots
from mock.level4_interviews import seed_interviews
from mock.level5_offers import seed_offers

def reset_database():
    """Wipes all database tables cleanly for a fresh slate before seeding."""
    print("🧹 Clearing database tables for a fresh mock run...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("  ✓ Database reset clean!")

def run_all():
    print("🚀 Starting Clean 5-Level Database Mock Generation...")
    
    # 1. Clear database tables
    reset_database()

    # 2. Seed all 5 levels sequentially
    db = SessionLocal()
    try:
        # Level 1: Users & Candidates
        ceo_user, hr_user, candidates = seed_users_and_candidates(db)

        # Level 2: Jobs (Consumes ceo_user)
        jobs = seed_jobs(db, ceo_user=ceo_user)

        # Level 3: Applications & Slots (Consumes candidates, jobs, and ceo_user)
        applications = seed_applications_and_slots(db, candidates=candidates, jobs=jobs, ceo_user=ceo_user)

        # Level 4: Interviews (Consumes applications, ceo_user, and hr_user)
        interviews = seed_interviews(db, applications=applications, ceo_user=ceo_user, hr_user=hr_user)

        # Level 5: Offers & Approvals (Consumes applications, jobs, and ceo_user)
        offers = seed_offers(db, applications=applications, jobs=jobs, ceo_user=ceo_user)

        print("\n✨ Success! Database wiped and all 5 levels generated cleanly!")

    except Exception as err:
        print(f"❌ Error during mock generation: {err}")
        db.rollback()
        raise err
    finally:
        db.close()

if __name__ == "__main__":
    run_all()
