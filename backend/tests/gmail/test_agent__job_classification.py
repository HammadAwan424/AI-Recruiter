import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.agents.job_classification import classify_application_emails
from app.schemas.gmail import (
    ClassifiedGmailMessages,
    GmailSyncContext,
    JobClassificationJob,
    JobClassificationMessage,
    JobClassificationRequest,
    ProcessedGmailMessages,
)
from tests.util.fixture_io import read_stage_schema, write_stage_artifact


def test_classify_gmail_messages():
    """Classify processed Gmail messages against the company job catalogue."""
    context = read_stage_schema(
        "gmail",
        "company_sync",
        "sync_context.v1.json",
        GmailSyncContext,
    )
    processed = read_stage_schema(
        "gmail",
        "company_sync",
        "processed_messages.v1.json",
        ProcessedGmailMessages,
    )

    assert processed.company_id == context.company_id
    assert processed.anchor_job_id == context.anchor_job_id

    messages = [
        JobClassificationMessage(
            gmail_message_id=message.gmail_message_id,
            subject=message.subject,
            text_content=message.text_content,
        )
        for message in processed.messages
    ]
    jobs = [JobClassificationJob.model_validate(job) for job in context.jobs]
    result = classify_application_emails(
        JobClassificationRequest(
            schema_version="gmail.job_classification_request.v1",
            company_id=context.company_id,
            anchor_job_id=context.anchor_job_id,
            messages=messages,
            jobs=jobs,
        )
    )

    artifact = ClassifiedGmailMessages(
        schema_version="gmail.classified_messages.v1",
        company_id=context.company_id,
        anchor_job_id=context.anchor_job_id,
        results=result.results,
    )
    output_path = write_stage_artifact(
        "gmail",
        "company_sync",
        "classified_messages.v1.json",
        artifact,
    )
    print(f"✓ Classified {len(result.results)} message(s).")


if __name__ == "__main__":
    test_classify_gmail_messages()
