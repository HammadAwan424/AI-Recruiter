import unittest

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Application, Candidate, Company, Job


class ModelConstraintTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        self.db = Session(self.engine)
        self.company = Company(name=f"Company {id(self)}")
        self.db.add(self.company)
        self.db.flush()
        self.job = Job(company_id=self.company.id, title="Engineer")
        self.db.add(self.job)
        self.db.flush()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_candidate_identity_is_company_scoped_and_normalized(self):
        self.db.add(
            Candidate(
                company_id=self.company.id,
                full_name="Candidate",
                email="candidate@example.com",
                normalized_email="candidate@example.com",
            )
        )
        self.db.commit()

        self.db.add(
            Candidate(
                company_id=self.company.id,
                full_name="Duplicate",
                email="CANDIDATE@example.com",
                normalized_email="candidate@example.com",
            )
        )
        with self.assertRaises(IntegrityError):
            self.db.commit()

    def test_one_application_per_candidate_and_job(self):
        candidate = Candidate(
            company_id=self.company.id,
            full_name="Candidate",
            email="candidate@example.com",
            normalized_email="candidate@example.com",
        )
        self.db.add(candidate)
        self.db.flush()
        self.db.add(Application(candidate_id=candidate.id, job_id=self.job.id))
        self.db.commit()

        self.db.add(Application(candidate_id=candidate.id, job_id=self.job.id))
        with self.assertRaises(IntegrityError):
            self.db.commit()


if __name__ == "__main__":
    unittest.main()
