import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.schemas.gmail import (
    ClassifiedGmailMessages,
    GmailPersistenceResult,
    GmailSyncContext,
    ProcessedGmailMessages,
)
from app.services.gmail.fetch_mails import group_latest_applications, persist_application_with_candidate
from tests.util.fixture_io import read_stage_schema, write_stage_artifact


def test_persist_applications():
    """
    Reads processed and classified message contracts, groups the latest usable
    message per candidate/job, and persists each job group.
    """
    context = read_stage_schema(
        "gmail",
        "company_sync",
        "sync_context.v2.json",
        GmailSyncContext,
    )
    processed = read_stage_schema(
        "gmail",
        "company_sync",
        "processed_messages.v2.json",
        ProcessedGmailMessages,
    )
    classified = read_stage_schema(
        "gmail",
        "company_sync",
        "classified_messages.v1.json",
        ClassifiedGmailMessages,
    )

    assert processed.company_id == classified.company_id == context.company_id
    assert processed.anchor_job_id == classified.anchor_job_id == context.anchor_job_id
    valid_job_ids = {job.id for job in context.jobs}
    plan = group_latest_applications(
        messages=processed,
        classifications=classified,
        valid_job_ids=valid_job_ids,
    )

    db = SessionLocal()
    try:
        total_saved = 0
        new_apps = 0
        renewed_apps = 0
        failed_upserts = 0
        summaries = []
        for batch in plan.batches:
            try:
                summary = persist_application_with_candidate(
                    db=db,
                    application_batch=batch,
                )
                total_saved += summary.total_saved
                new_apps += summary.new_applications
                renewed_apps += summary.renewed_applications
                summaries.append({
                    "job_id": batch.job_id,
                    "total_saved": summary.total_saved,
                    "new_applications": summary.new_applications,
                    "renewed_applications": summary.renewed_applications,
                    "failed_upserts": 0,
                })
            except Exception:
                db.rollback()
                failed_upserts += len(batch.applications)
                summaries.append({
                    "job_id": batch.job_id,
                    "total_saved": 0,
                    "new_applications": 0,
                    "renewed_applications": 0,
                    "failed_upserts": len(batch.applications),
                })

        classified_count = sum(1 for result in classified.results if result.job_id in valid_job_ids)
        artifact = GmailPersistenceResult(
            schema_version="gmail.persistence_result.v2",
            company_id=context.company_id,
            anchor_job_id=context.anchor_job_id,
            gmail_account_id=context.gmail_account_id,
            total_fetched=len(processed.messages),
            classified_count=classified_count,
            unmatched_count=len(processed.messages) - classified_count,
            total_saved=total_saved,
            new_applications=new_apps,
            renewed_applications=renewed_apps,
            failed_upsert_count=failed_upserts,
            job_summaries=summaries,
        )
        output_path = write_stage_artifact(
            "gmail",
            "company_sync",
            "persistence_result.v2.json",
            artifact,
        )

        print(f"✓ Persisted {total_saved} total application(s) ({new_apps} new, {renewed_apps} renewed).")
        print(f"✓ wrote {output_path}")

    finally:
        db.close()


if __name__ == "__main__":
    test_persist_applications()
