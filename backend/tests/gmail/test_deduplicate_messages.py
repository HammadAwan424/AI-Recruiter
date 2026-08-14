import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.utils.gmail import get_gmail_service
from app.schemas.gmail import GmailSyncContext
from app.services.gmail.fetch_mails import get_deduped_mails
from tests.util.fixture_io import read_stage_schema, write_stage_artifact


def test_get_deduped_mails():
    """
    Reads the sync context, deduplicates Gmail message IDs, and writes the
    typed header artifact consumed by message processing.
    """
    context = read_stage_schema(
        "gmail",
        "company_sync",
        "sync_context.v2.json",
        GmailSyncContext,
    )

    db = SessionLocal()
    try:
        service = get_gmail_service()
        artifact = get_deduped_mails(
            service=service,
            db=db,
            sync_context=context,
        )

        output_path = write_stage_artifact(
            "gmail",
            "company_sync",
            "deduped_message_headers.v2.json",
            artifact,
        )

        print(f"✓ Found {len(artifact.deduped_mails)} deduped emails, {len(artifact.duplicated_mails)} duplicated emails.")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_get_deduped_mails()
