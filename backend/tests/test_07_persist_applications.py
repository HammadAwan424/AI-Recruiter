import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Company, Job
from app.schemas.application import FetchedEmailApplication
from app.services.gmail.fetch_mails import persist_application_with_candidate


def test_persist_applications():
    """
    Stage 7: Reads processed applications from 06_processed_applications.json
    and tests persist_application_with_candidate(db, job_id, fetched_applications).
    """
    input_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail", "06_processed_applications.json")
    assert os.path.exists(input_path), f"Input file not found at {input_path}. Please run test_06_process_mails.py first."

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    job_id = data["job_id"]
    apps_data = data.get("applications", [])

    fetched_apps = [FetchedEmailApplication(**app) for app in apps_data]

    db = SessionLocal()
    try:
        total_saved, new_apps, renewed_apps = persist_application_with_candidate(
            db=db,
            job_id=job_id,
            fetched_applications=fetched_apps
        )

        output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail")
        output_path = os.path.join(output_dir, "07_persistence_result.json")

        payload = {
            "job_id": job_id,
            "total_saved": total_saved,
            "new_applications": new_apps,
            "renewed_applications": renewed_apps
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        print(f"✓ Persisted {total_saved} total application(s) ({new_apps} new, {renewed_apps} renewed).")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_persist_applications()
