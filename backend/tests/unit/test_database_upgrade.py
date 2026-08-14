import json
import unittest

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.database import Base
from app.database_upgrade import upgrade_existing_schema
from app.models import Application, ApplicationScreening, Candidate, Company, Job


class DatabaseUpgradeTests(unittest.TestCase):
    def test_upgrade_canonicalizes_json_before_runtime_reads(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        db = Session(engine)

        company = Company(name="Upgrade Test Company")
        db.add(company)
        db.flush()
        job = Job(company_id=company.id, title="Engineer")
        candidate = Candidate(
            company_id=company.id,
            full_name="Candidate",
            email="candidate@example.com",
            normalized_email="candidate@example.com",
        )
        db.add_all([job, candidate])
        db.flush()
        application = Application(
            candidate_id=candidate.id,
            job_id=job.id,
            cv_pdf_path="resume.pdf",
        )
        db.add(application)
        db.flush()
        db.add(ApplicationScreening(
            application_id=application.id,
            skills_match=80,
            experience_match=80,
            education_match=80,
            keyword_coverage=80,
            match_score=80,
            confidence=90,
            evidence={
                "skills_match": {"matched": [], "missing": []},
                "experience_match": {"matched": [], "missing": []},
                "education_match": {"matched": [], "missing": []},
                "keyword_coverage": {"matched": [], "missing": []},
            },
            fit_flags=[],
            weights_used={
                "skills_match": 0.35,
                "experience_match": 0.35,
                "education_match": 0.15,
                "keyword_coverage": 0.15,
            },
        ))
        db.commit()

        with engine.begin() as connection:
            connection.execute(
                text("UPDATE applications SET parsed_profile = :value WHERE id = :id"),
                {
                    "id": application.id,
                    "value": json.dumps({
                        "skills": ["Python"],
                        "experience": [{
                            "title": "Engineer",
                            "company": "Acme",
                            "duration": "2020-Present",
                        }],
                        "education": [],
                        "certifications": [],
                    }),
                },
            )
            connection.execute(
                text("UPDATE application_screenings SET fit_flags = :value WHERE application_id = :id"),
                {"id": application.id, "value": json.dumps([])},
            )

        report = upgrade_existing_schema(engine)
        self.assertEqual(report.converted_json_rows, 2)

        with engine.connect() as connection:
            profile = json.loads(connection.execute(text(
                "SELECT parsed_profile FROM applications WHERE id = :id"
            ), {"id": application.id}).scalar_one())
            self.assertEqual(profile["schema_version"], "extraction.parsed_resume_profile.v1")
            self.assertEqual(profile["profile"]["work_history"][0]["start_date"], "2020-Present")

        db.close()
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
