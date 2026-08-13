import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.utils.gmail import get_gmail_service
from app.services.gmail.fetch_mails import process_mails


def test_process_mails():
    """
    Stage 6: Reads 05_deduped_mails.json (deduped_mails list), executes process_mails(...),
    and checkpoints output to 06_processed_applications.json
    """
    input_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail", "05_deduped_mails.json")
    assert os.path.exists(input_path), f"Input file not found at {input_path}. Please run test_05_get_deduped_mails.py first."

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    job_id = data["job_id"]
    deduped_mails = data["deduped_mails"]

    db = SessionLocal()
    try:
        service = get_gmail_service()
        fetched_applications = process_mails(
            service=service,
            db=db,
            job_id=job_id,
            deduped_mails=deduped_mails
        )

        output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail")
        output_path = os.path.join(output_dir, "06_processed_applications.json")

        serialized_apps = [app.model_dump(mode="json") for app in fetched_applications]
        payload = {
            "job_id": job_id,
            "processed_count": len(fetched_applications),
            "applications": serialized_apps
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        print(f"✓ Processed {len(fetched_applications)} application(s).")
        for idx, app in enumerate(fetched_applications[:3], 1):
            print(f"  [{idx}] {app.full_name} <{app.email}> ({len(app.cv_text)} chars text)")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_process_mails()
