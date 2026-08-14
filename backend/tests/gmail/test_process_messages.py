import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.utils.gmail import get_gmail_service
from app.schemas.gmail import DedupedGmailMessages
from app.services.gmail.fetch_mails import process_mails
from tests.util.fixture_io import read_stage_schema, write_stage_artifact


def test_process_mails():
    """
    Reads deduped message headers, retrieves full Gmail messages, validates the
    processed-message contract, and writes the artifact consumed by
    classification and persistence.
    """
    deduped = read_stage_schema(
        "gmail",
        "company_sync",
        "deduped_message_headers.v1.json",
        DedupedGmailMessages,
    )

    db = SessionLocal()
    try:
        service = get_gmail_service()
        artifact = process_mails(
            service=service,
            db=db,
            deduped_messages=deduped,
        )

        output_path = write_stage_artifact(
            "gmail",
            "company_sync",
            "processed_messages.v1.json",
            artifact,
        )

        print(f"✓ Processed {len(artifact.messages)} message(s).")
        for idx, message in enumerate(artifact.messages[:3], 1):
            print(f"  [{idx}] {message.full_name} <{message.email}> ({len(message.cv_text or '')} chars CV text)")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_process_mails()
