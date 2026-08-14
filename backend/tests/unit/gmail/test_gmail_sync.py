import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import Base
from app.models import Company, Job
from app.schemas.application import FetchedEmailApplication
from app.schemas.gmail import (
    ClassifiedGmailMessages,
    DedupedGmailMessages,
    FetchedGmailMessage,
    GmailApplicationBatch,
    JobClassificationBatchResult,
    JobClassificationResult,
    ProcessedGmailMessages,
)
from app.services.gmail import fetch_mails
from app.services.gmail.fetch_mails import (
    fetch_job_application_emails_service,
    get_after_date,
    group_latest_applications,
    persist_application_with_candidate,
)


class GmailSyncTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        self.db = self.Session()
        self.company = Company(name=f"Sync Test Company {id(self)}")
        self.db.add(self.company)
        self.db.flush()
        self.job_one = Job(company_id=self.company.id, title="AI Engineer")
        self.job_two = Job(company_id=self.company.id, title="Frontend Engineer")
        self.db.add_all([self.job_one, self.job_two])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_after_date_uses_company_cursor(self):
        self.company.gmail_last_read = datetime(2026, 8, 10, 17, 45)
        self.db.commit()

        context = get_after_date(self.db, self.job_one.id)

        self.assertEqual(context.after_date_query, "2026/08/10")
        self.assertEqual(context.gmail_last_read, datetime(2026, 8, 10, 17, 45))

    def test_latest_message_is_selected_per_candidate_and_job(self):
        older = datetime(2026, 8, 10, 10, 0)
        newer = older + timedelta(hours=2)
        messages = [
            FetchedGmailMessage(
                gmail_message_id="old",
                full_name="Candidate",
                email="candidate@example.com",
                cv_text="old CV",
                received_at=older,
            ),
            FetchedGmailMessage(
                gmail_message_id="new",
                full_name="Candidate",
                email="CANDIDATE@example.com",
                cv_text="new CV",
                received_at=newer,
            ),
        ]
        processed = ProcessedGmailMessages(
            schema_version="gmail.processed_messages.v1",
            company_id=self.company.id,
            anchor_job_id=self.job_one.id,
            messages=messages,
        )
        classifications = ClassifiedGmailMessages(
            schema_version="gmail.classified_messages.v1",
            company_id=self.company.id,
            anchor_job_id=self.job_one.id,
            results=[
                JobClassificationResult(gmail_message_id="old", job_id=self.job_two.id),
                JobClassificationResult(gmail_message_id="new", job_id=self.job_two.id),
            ],
        )

        plan = group_latest_applications(processed, classifications, {self.job_two.id})

        self.assertEqual(plan.batches[0].applications[0].gmail_message_id, "new")

    def test_existing_application_renewal_records_latest_gmail_message(self):
        first = FetchedEmailApplication(
            full_name="Candidate",
            email="candidate@example.com",
            cv_text="old CV",
            gmail_message_id="old-message",
            received_at=datetime(2026, 8, 10, 10, 0),
        )
        latest = FetchedEmailApplication(
            full_name="Candidate",
            email="CANDIDATE@example.com",
            cv_text="new CV",
            gmail_message_id="new-message",
            received_at=datetime(2026, 8, 11, 10, 0),
        )

        persist_application_with_candidate(
            self.db,
            GmailApplicationBatch(
                schema_version="gmail.application_batch.v1",
                job_id=self.job_one.id,
                applications=[first],
            ),
        )
        persist_application_with_candidate(
            self.db,
            GmailApplicationBatch(
                schema_version="gmail.application_batch.v1",
                job_id=self.job_one.id,
                applications=[latest],
            ),
        )

        application = self.job_one.applications[0]
        self.assertEqual(application.gmail_message_id, "new-message")
        self.assertEqual(application.cv_text, "new CV")

    def test_company_sync_advances_cursor_for_unmatched_messages(self):
        latest_time = datetime(2026, 8, 12, 12, 0)
        fetched_messages = [
            FetchedGmailMessage(
                gmail_message_id="matched",
                full_name="Candidate",
                email="candidate@example.com",
                subject="Frontend Engineer",
                text_content="Application for Frontend Engineer",
                cv_text="new CV",
                received_at=datetime(2026, 8, 12, 10, 0),
            ),
            FetchedGmailMessage(
                gmail_message_id="unmatched",
                subject="Newsletter",
                text_content="Unrelated content",
                received_at=latest_time,
            ),
        ]

        processed = ProcessedGmailMessages(
            schema_version="gmail.processed_messages.v1",
            company_id=self.company.id,
            anchor_job_id=self.job_one.id,
            messages=fetched_messages,
        )
        deduped = DedupedGmailMessages(
            schema_version="gmail.deduped_messages.v1",
            company_id=self.company.id,
            anchor_job_id=self.job_one.id,
            after_date_query="2026/08/01",
            deduped_mails=[{"id": "matched"}, {"id": "unmatched"}],
        )
        with patch.object(fetch_mails, "get_gmail_service", return_value=object()), \
             patch.object(fetch_mails, "get_deduped_mails", return_value=deduped), \
             patch.object(fetch_mails, "process_mails", return_value=processed), \
             patch.object(
                 fetch_mails,
                 "classify_application_emails",
                 return_value=JobClassificationBatchResult(
                     results=[
                         JobClassificationResult(gmail_message_id="matched", job_id=self.job_two.id),
                         JobClassificationResult(gmail_message_id="unmatched", job_id=None),
                     ]
                 ),
             ):
            result = fetch_job_application_emails_service(self.db, self.job_one.id)

        self.assertEqual(result.total_saved, 1)
        self.assertEqual(result.unmatched_count, 1)
        self.assertEqual(self.company.gmail_last_read, latest_time)
        self.assertEqual(self.job_two.applications[0].job_id, self.job_two.id)


if __name__ == "__main__":
    unittest.main()
