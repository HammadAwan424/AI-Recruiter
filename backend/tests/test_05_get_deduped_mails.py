import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.utils.gmail import get_gmail_service
from app.services.gmail.fetch_mails import get_deduped_mails


def test_get_deduped_mails():
    """
    Stage 5: Reads 04_after_date.json, executes get_deduped_mails(...),
    and checkpoints output to 05_deduped_mails.json
    """
    input_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail", "04_after_date.json")
    assert os.path.exists(input_path), f"Input file not found at {input_path}. Please run test_04_get_after_date.py first."

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    job_id = data["job_id"]
    job_title = data["job_title"]
    after_date_query = data["after_date_query"]

    db = SessionLocal()
    try:
        service = get_gmail_service()
        deduped_mails, duplicated_mails = get_deduped_mails(
            service=service,
            db=db,
            job_title=job_title,
            after_date_query=after_date_query
        )

        output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail")
        output_path = os.path.join(output_dir, "05_deduped_mails.json")

        payload = {
            "job_id": job_id,
            "job_title": job_title,
            "after_date_query": after_date_query,
            "deduped_count": len(deduped_mails),
            "duplicated_count": len(duplicated_mails),
            "deduped_mails": deduped_mails,
            "duplicated_mails": duplicated_mails
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        print(f"✓ Found {len(deduped_mails)} deduped emails, {len(duplicated_mails)} duplicated emails.")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_get_deduped_mails()
