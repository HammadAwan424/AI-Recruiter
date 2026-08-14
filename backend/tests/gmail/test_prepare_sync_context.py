import sys
from datetime import datetime
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.models import Company, Job
from app.services.gmail.fetch_mails import get_after_date
from tests.util.fixture_io import write_stage_artifact

# ─────────────────────────────────────────────────────────────
# CONFIGURABLE TEST TIMESTAMP FOR COMPANY.GMAIL_LAST_READ
# Change this timestamp to test different 'after' date query bounds:
# ─────────────────────────────────────────────────────────────
CONFIGURABLE_LAST_READ = datetime(2026, 8, 5, 14, 30, 0)


def test_prepare_sync_context():
    """
    Creates the company sync context consumed by all later Gmail stages.
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
        test_company.gmail_last_read = CONFIGURABLE_LAST_READ

        # 2. Create or retrieve test Job
        test_job = (
            db.query(Job)
            .filter(Job.company_id == test_company.id, Job.title == "Test AI Engineer")
            .first()
        )
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
        context = get_after_date(db, test_job.id)
        output_path = write_stage_artifact(
            "gmail",
            "company_sync",
            "sync_context.v1.json",
            context,
        )

        print(f"✓ Configured company.gmail_last_read: {CONFIGURABLE_LAST_READ.isoformat()}")
        print(f"✓ Job #{test_job.id} '{test_job.title}': after_date_query='{context.after_date_query}'")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_prepare_sync_context()
