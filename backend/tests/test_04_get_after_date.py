import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Company, Job
from app.services.gmail.fetch_mails import get_after_date

# ─────────────────────────────────────────────────────────────
# CONFIGURABLE TEST TIMESTAMP FOR JOB.LAST_READ
# Change this timestamp to test different 'after' date query bounds:
# ─────────────────────────────────────────────────────────────
CONFIGURABLE_LAST_READ = datetime(2026, 8, 5, 14, 30, 0)


def test_get_after_date():
    """
    Stage 4: Creates a test Company and Job with user-configured last_read timestamp,
    executes get_after_date(db, job.id), and checkpoints output to 04_after_date.json.
    """
    db = SessionLocal()
    try:
        # 1. Create or retrieve test Company
        test_company = db.query(Company).filter(Company.name == "Test AI Corp").first()
        if not test_company:
            test_company = Company(name="Test AI Corp")
            db.add(test_company)
            db.commit()
            db.refresh(test_company)

        # 2. Create or retrieve test Job
        test_job = db.query(Job).filter(Job.title == "Test AI Engineer").first()
        if not test_job:
            test_job = Job(
                company_id=test_company.id,
                title="Test AI Engineer",
                full_description="Test Job Description for Stage 4",
                keywords="Python, AI, FastAPI",
                last_read=CONFIGURABLE_LAST_READ
            )
            db.add(test_job)
        else:
            test_job.last_read = CONFIGURABLE_LAST_READ

        db.commit()
        db.refresh(test_job)

        # 3. Execute get_after_date subcomponent
        after_date_query, last_read_ts = get_after_date(db, test_job.id)

        output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "04_after_date.json")

        payload = {
            "job_id": test_job.id,
            "job_title": test_job.title,
            "configured_last_read": CONFIGURABLE_LAST_READ.isoformat(),
            "after_date_query": after_date_query,
            "last_read_timestamp": last_read_ts.isoformat() if last_read_ts else None
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        print(f"✓ Configured job.last_read: {CONFIGURABLE_LAST_READ.isoformat()}")
        print(f"✓ Job #{test_job.id} '{test_job.title}': after_date_query='{after_date_query}'")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_get_after_date()
