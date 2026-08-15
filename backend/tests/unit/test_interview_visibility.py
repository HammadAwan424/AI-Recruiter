from datetime import datetime, timedelta
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import Base
from app.models import (
    Application,
    Candidate,
    Company,
    InterviewInterviewers,
    InterviewModel,
    Job,
    Role,
    User,
)
from app.models.interview import InterviewSlot
from app.utils.security import (
    get_scoped_interview_slots_query,
    get_scoped_interviews_query,
    get_interview_or_403,
)


class InterviewVisibilityTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)

        company = Company(name="Interview Visibility Company")
        self.db.add(company)
        self.db.flush()

        self.db.add_all([
            Role(name="interviewer", company_id=company.id, job_scope="own"),
            Role(name="recruiter", company_id=company.id, job_scope="all"),
        ])

        self.owner = User(
            full_name="Assigned Interviewer",
            email="assigned@example.com",
            password="password",
            role="interviewer",
            company_id=company.id,
        )
        self.teammate = User(
            full_name="Teammate Interviewer",
            email="teammate@example.com",
            password="password",
            role="interviewer",
            company_id=company.id,
        )
        self.recruiter = User(
            full_name="Company Recruiter",
            email="recruiter@example.com",
            password="password",
            role="recruiter",
            company_id=company.id,
        )
        self.db.add_all([self.owner, self.teammate, self.recruiter])
        self.db.flush()

        job = Job(company_id=company.id, title="Backend Engineer", created_by=self.recruiter.id)
        self.db.add(job)
        self.db.flush()

        candidates = [
            Candidate(
                company_id=company.id,
                full_name=f"Candidate {index}",
                email=f"candidate{index}@example.com",
                normalized_email=f"candidate{index}@example.com",
            )
            for index in range(1, 4)
        ]
        self.db.add_all(candidates)
        self.db.flush()

        applications = [
            Application(candidate_id=candidate.id, job_id=job.id)
            for candidate in candidates
        ]
        self.db.add_all(applications)
        self.db.flush()

        self.personal_interview = InterviewModel(
            application_id=applications[0].id,
            meeting_link="https://meet.example.com/personal",
            created_by=self.teammate.id,
        )
        self.created_by_owner_interview = InterviewModel(
            application_id=applications[1].id,
            meeting_link="https://meet.example.com/created",
            created_by=self.owner.id,
        )
        self.team_interview = InterviewModel(
            application_id=applications[2].id,
            meeting_link="https://meet.example.com/team",
            created_by=self.teammate.id,
        )
        self.db.add_all([
            self.personal_interview,
            self.created_by_owner_interview,
            self.team_interview,
        ])
        self.db.flush()
        self.db.add_all([
            InterviewInterviewers(
                interview_id=self.personal_interview.id,
                interviewer_id=self.owner.id,
            ),
            InterviewInterviewers(
                interview_id=self.team_interview.id,
                interviewer_id=self.teammate.id,
            ),
        ])

        now = datetime(2030, 1, 1, 9, 0)
        self.owner_slot = InterviewSlot(
            interviewer_id=self.owner.id,
            schedule_start=now,
            schedule_end=now + timedelta(hours=1),
        )
        self.teammate_slot = InterviewSlot(
            interviewer_id=self.teammate.id,
            schedule_start=now + timedelta(hours=1),
            schedule_end=now + timedelta(hours=2),
        )
        self.db.add_all([self.owner_slot, self.teammate_slot])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    @staticmethod
    def _current_user(user):
        return {
            "user_id": user.id,
            "role": user.role,
            "company_id": user.company_id,
        }

    def test_assigned_only_interviews_are_limited_to_personal_interviews(self):
        visible = get_scoped_interviews_query(
            db=self.db,
            current_user=self._current_user(self.owner),
        ).all()

        self.assertEqual(
            {interview.id for interview in visible},
            {self.personal_interview.id, self.created_by_owner_interview.id},
        )

    def test_all_scope_can_see_team_interviews(self):
        visible = get_scoped_interviews_query(
            db=self.db,
            current_user=self._current_user(self.recruiter),
        ).all()

        self.assertEqual(
            {interview.id for interview in visible},
            {
                self.personal_interview.id,
                self.created_by_owner_interview.id,
                self.team_interview.id,
            },
        )

    def test_assigned_only_slots_are_limited_to_current_interviewer(self):
        visible = get_scoped_interview_slots_query(
            db=self.db,
            current_user=self._current_user(self.owner),
        ).all()

        self.assertEqual({slot.id for slot in visible}, {self.owner_slot.id})

    def test_all_scope_can_see_company_team_slots(self):
        visible = get_scoped_interview_slots_query(
            db=self.db,
            current_user=self._current_user(self.recruiter),
        ).all()

        self.assertEqual(
            {slot.id for slot in visible},
            {self.owner_slot.id, self.teammate_slot.id},
        )

    def test_assigned_only_single_interview_guard_matches_list_visibility(self):
        own_interview = get_interview_or_403(
            interview_id=self.created_by_owner_interview.id,
            db=self.db,
            current_user=self._current_user(self.owner),
        )
        self.assertEqual(own_interview.id, self.created_by_owner_interview.id)

        with self.assertRaises(HTTPException) as context:
            get_interview_or_403(
                interview_id=self.team_interview.id,
                db=self.db,
                current_user=self._current_user(self.owner),
            )

        self.assertEqual(context.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
